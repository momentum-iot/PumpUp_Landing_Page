// debug: ensure script loaded
console.debug('main.js loaded', {url: location.href});

// Navegación móvil
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle && navToggle.addEventListener('click', ()=>{
  nav.classList.toggle('open');
});

// Smooth scroll
const scrollFeatures = document.getElementById('scrollFeatures');
scrollFeatures && scrollFeatures.addEventListener('click', ()=>{
  document.getElementById('features').scrollIntoView({behavior:'smooth'});
});

// Demo button scroll to contact
const demoBtn = document.getElementById('demoBtn');
demoBtn && demoBtn.addEventListener('click', ()=>{
  document.getElementById('contact').scrollIntoView({behavior:'smooth'});
});

// Form simple validation + mock send
const contactForm = document.getElementById('contactForm');
contactForm && contactForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  if(!name || !email){
    showToast('Por favor completa nombre y email.');
    return;
  }
  // Mock success: decorative only
  showToast('Gracias, ' + name + '. Hemos recibido tu solicitud.');
  contactForm.reset();
});

// Toast helper
function showToast(message, timeout = 3500){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  // trigger reflow for animation
  requestAnimationFrame(()=> t.classList.add('show'));
  clearTimeout(t._timeout);
  t._timeout = setTimeout(()=>{
    t.classList.remove('show');
  }, timeout);
}

// Reveal on scroll + counters
function setupRevealAndCounters(){
  const reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('show');
          // trigger counters inside
          const nums = entry.target.querySelectorAll('[data-target]');
          nums.forEach(el=>{
            if(!el._counted) countUp(el, parseInt(el.getAttribute('data-target'),10));
          });
          io.unobserve(entry.target);
        }
      });
    },{threshold:0.18});
    reveals.forEach(r=>io.observe(r));
  } else {
    // fallback: show all
    reveals.forEach(r=>{
      r.classList.add('show');
      const nums = r.querySelectorAll('[data-target]');
      nums.forEach(el=>countUp(el, parseInt(el.getAttribute('data-target'),10)));
    });
  }
}

function countUp(el, target){
  el._counted = true;
  const duration = 1400;
  const start = 0;
  const startTime = performance.now();
  function step(now){
    const progress = Math.min((now-startTime)/duration,1);
    const value = Math.floor(progress * (target - start) + start);
    el.textContent = value.toLocaleString();
    if(progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', ()=>{
  setupRevealAndCounters();
  setupDashboardTabs();
  setupRouter();
  setupUIHelpers();
  setHeaderHeightCSS();
  window.addEventListener('resize', setHeaderHeightCSS);
});

// Dashboard tabs logic
function setupDashboardTabs(){
  const tabs = document.querySelectorAll('.dashboard .tab');
  const panels = document.querySelectorAll('.dashboard-panel');
  if(!tabs.length) return;

  function activate(targetId, pushState=true){
    tabs.forEach(t=>{
      const is = t.getAttribute('data-target') === targetId;
      t.classList.toggle('active', is);
      t.setAttribute('aria-selected', is ? 'true' : 'false');
    });
    panels.forEach(p=>{
      const show = p.id === targetId;
      p.hidden = !show;
      if(show){
        p.classList.add('show');
      }
    });
    if(pushState){
      history.replaceState(null,'', '#dashboard-' + targetId);
    }
  }

  tabs.forEach(t=>t.addEventListener('click', ()=> activate(t.getAttribute('data-target'))));

  // deep-link from hash e.g. #dashboard-managers
  const h = location.hash.replace('#','');
  if(h.startsWith('dashboard-')){
    const target = h.replace('dashboard-','');
    activate(target,false);
  }
}

// Simple hash router for SPA views
function setupRouter(){
  const views = document.querySelectorAll('.app-view');
  function showView(name){
    // find current active
    const current = document.querySelector('.app-view.active');
    const next = document.getElementById(name);
    if(!next) return;
    if(current === next) return;
    // hide current with transition
    if(current){
      current.classList.remove('active');
      // after transition hide via attribute for layout
      setTimeout(()=>{
        if(current.id !== 'landing') current.setAttribute('hidden','');
      }, 380);
    }
    // show next
    next.removeAttribute('hidden');
    requestAnimationFrame(()=>{
      next.classList.add('active');
      // re-run reveals within new view
      setupRevealAndCounters();
      // move focus to new view heading for accessibility
      const h = next.querySelector('h1, h2, h3');
      if(h){
        h.setAttribute('tabindex','-1');
        h.focus({preventScroll:false});
      }
    });
  }

  function resolveHash(){
    const hash = location.hash.replace('#','');
    if(!hash || hash === '/' ) return 'landing';
    // expected patterns: /managers or /members or contact or dashboard-managers
    if(hash.startsWith('/')){
      const route = hash.slice(1);
      if(route === 'managers') return 'managers-view';
      if(route === 'members') return 'members-view';
      return 'landing';
    }
    if(hash.startsWith('dashboard-')){
      // keep landing but open dashboard tabs via existing handler
      return 'landing';
    }
    if(hash === 'contact') return 'landing';
    return 'landing';
  }

  window.addEventListener('hashchange', ()=> showView(resolveHash()));
  // initial
  showView(resolveHash());
}

// UI helpers: header shrink, active link, mobile close, back-to-top
function setupUIHelpers(){
  const header = document.querySelector('.site-header');
  const backTop = document.getElementById('backTop');
  const navLinks = document.querySelectorAll('.nav-link');
  const navEl = document.getElementById('nav');

  // shrink header on scroll
  let lastScroll = 0;
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY || window.pageYOffset;
    if(y > 60) header.classList.add('shrink'); else header.classList.remove('shrink');
    // back-to-top
    if(backTop){
      if(y > 300) backTop.classList.add('show'); else backTop.classList.remove('show');
    }
    lastScroll = y;
  }, {passive:true});

  // nav link active highlight based on hash
  function updateActiveLink(){
    const h = location.hash.replace('#','');
    navLinks.forEach(a=>{
      const href = a.getAttribute('href') || '';
      const route = href.replace('#','');
      const isActive = (route === '' && (h === '' || h === '/')) || (route && (h === route || h.startsWith(route) || h === '/' + route));
      a.classList.toggle('active', isActive);
    });
  }
  window.addEventListener('hashchange', updateActiveLink);
  updateActiveLink();

  // close mobile nav when clicking a nav-link
  navLinks.forEach(a=> a.addEventListener('click', ()=>{
    if(navEl.classList.contains('open')) navEl.classList.remove('open');
  }));

  // back-to-top click
  if(backTop) backTop.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));

  // make toast accessible
  const oldToast = document.querySelector('.toast');
  if(oldToast) oldToast.setAttribute('role','status');
}

// Detect visual overlaps from fixed UI elements and add padding to content blocks if needed
function adjustForOverlaps(){
  const uiEls = [];
  const navOpen = document.querySelector('.nav.open');
  if(navOpen) uiEls.push(navOpen.getBoundingClientRect());
  const header = document.querySelector('.site-header');
  if(header) uiEls.push(header.getBoundingClientRect());
  const backTop = document.getElementById('backTop');
  if(backTop && backTop.classList.contains('show')) uiEls.push(backTop.getBoundingClientRect());
  const toast = document.querySelector('.toast.show');
  if(toast) uiEls.push(toast.getBoundingClientRect());

  // targets to protect
  const targets = document.querySelectorAll('.card, .hero-text, .panel-main, .section-title');
  targets.forEach(t=>{
    t.style.paddingBottom = '';
    t.style.paddingTop = '';
    const r = t.getBoundingClientRect();
    let overlap = 0;
    uiEls.forEach(u=>{
      // simple vertical overlap check
      const verticalOverlap = Math.max(0, Math.min(r.bottom, u.bottom) - Math.max(r.top, u.top));
      if(verticalOverlap > overlap) overlap = verticalOverlap;
    });
    if(overlap > 0){
      // add half overlap as padding to avoid cover
      t.style.paddingBottom = (parseFloat(getComputedStyle(t).paddingBottom) + overlap/2) + 'px';
    }
  });
}

// call adjustForOverlaps on key events
window.addEventListener('resize', ()=>{ setTimeout(adjustForOverlaps,120); });
window.addEventListener('hashchange', ()=> setTimeout(adjustForOverlaps,150));
// when nav toggles
const navToggleBtn = document.getElementById('navToggle');
navToggleBtn && navToggleBtn.addEventListener('click', ()=> setTimeout(adjustForOverlaps,250));

// call once on load
setTimeout(adjustForOverlaps,400);

function setHeaderHeightCSS(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  const h = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height', h + 'px');
  // ensure main padding equals header height
  const main = document.getElementById('main-content');
  if(main) main.style.paddingTop = `calc(${h}px + 8px)`;
}
