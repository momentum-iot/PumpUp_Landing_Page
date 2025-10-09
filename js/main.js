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
    // ensure dashboard section is visible and scrolled into view
    const dashboardSection = document.getElementById('dashboard');
    if(dashboardSection){
      setTimeout(()=> dashboardSection.scrollIntoView({behavior:'smooth', block:'start'}), 80);
    }
  }

  tabs.forEach(t=>t.addEventListener('click', ()=> activate(t.getAttribute('data-target'))));

  // deep-link from hash e.g. #dashboard-managers — also react to future hashchanges
  function checkDashboardHash(){
    const h = location.hash.replace('#','');
    if(h.startsWith('dashboard-')){
      const target = h.replace('dashboard-','');
      activate(target,false);
    }
  }
  // initial check
  checkDashboardHash();
  // respond to subsequent hash changes
  window.addEventListener('hashchange', checkDashboardHash);
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
    navLinks.forEach(a=> a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href') || '';
      // If top nav targets managers/members, open the dashboard tab in landing instead of navigating away
      if(href === '#/managers' || href === '#/members'){
        e.preventDefault();
        const target = href === '#/managers' ? 'managers' : 'members';
        // set dashboard deep-link which the router + dashboard handler will honor
        location.hash = 'dashboard-' + target;
        // close mobile nav
        if(navEl.classList.contains('open')) navEl.classList.remove('open');
        return;
      }
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

const I18N = {
  es: {
    "nav.home": "Inicio",
    "nav.managers": "Gerentes",
    "nav.members": "Entrenados",
    "nav.contact": "Contacto",
    "cta.requestDemo": "Solicitar demo",
    "cta.freeTrial": "Prueba gratis",
    "cta.viewFeatures": "Ver características",
    "cta.getStarted": "Comenzar",
    "cta.wantApp": "Quiero la app",
    "cta.contactSales": "Contactar ventas",

    "hero.title": "PumpUp — Gestión inteligente para gimnasios",
    "hero.lead": "Control de accesos, monitoreo de equipos y analíticas en tiempo real para gerentes y una experiencia personalizada para quienes entrenan.",

    "dashboard.title": "Panel de beneficios por perfil",
    "dashboard.subtitle": "Selecciona tu rol para ver las funcionalidades y beneficios hechos a la medida",
    "tabs.managers": "Gerentes & Asesores",
    "tabs.members": "Personas que entrenan",

    "features.title": "Qué ofrece PumpUp",
    "features.accessTitle": "Control de accesos",
    "features.accessDesc": "Biometría, NFC o membresías digitales con registro automático y trazabilidad de entradas y salidas.",
    "features.monitorTitle": "Monitoreo de equipos",
    "features.monitorDesc": "Sensores IoT que reportan uso de máquinas, detectan sobrecarga y optimizan mantenimiento.",
    "features.analyticsTitle": "Analytics & dashboards",
    "features.analyticsDesc": "Informes en tiempo real para decisiones operativas: aforo, horarios pico y retención de miembros.",

    "segments.title": "Pensado para dos audiencias",
    "segments.mgrTitle": "Gerentes y asesores de gimnasio",
    "segments.mgrDesc": "Herramientas para gestionar operaciones, reducir trabajo manual y obtener insights accionables. Ideal para dueños, gerentes y consultores que buscan eficiencia y crecimiento.",
    "segments.memTitle": "Personas que entrenan",
    "segments.memDesc": "Una app sencilla que muestra tu historial de visitas, métricas de entrenamiento y recomendaciones para mejorar tu rendimiento y seguridad.",

    "plans.title": "Planes",
    "plans.subtitle": "Elige el plan que mejor se adapte a las necesidades de tu gimnasio.",
    "plans.basic.title": "Básico",
    "plans.basic.price": "$29/mes",
    "plans.basic.item1": "Control de accesos biométrico y NFC",
    "plans.basic.item2": "Registro automático de entradas y salidas",
    "plans.basic.item3": "Dashboard de ocupación en tiempo real",
    "plans.basic.item4": "Soporte estándar por correo",
    "plans.pro.title": "Pro",
    "plans.pro.price": "$59/mes",
    "plans.pro.item1": "Todo lo del plan Básico",
    "plans.pro.item2": "Monitoreo IoT de equipos y alertas",
    "plans.pro.item3": "Reportes personalizados y exportación CSV",
    "plans.pro.item4": "Soporte prioritario y onboarding guiado",

    "contact.title": "Contacto y solicitud de demo",
    "contact.subtitle": "Déjanos tus datos y te contactamos para una demostración personalizada.",
    "contact.nameLabel": "Nombre",
    "contact.emailLabel": "Email",
    "contact.roleLabel": "¿Eres?",
    "contact.role.manager": "Gerente / Asesor",
    "contact.role.athlete": "Persona que entrena",
    "contact.messageLabel": "Mensaje",
    "contact.success": "¡Enviado! Te contactaremos pronto.",
    "contact.error": "No pudimos enviar tu solicitud. Inténtalo nuevamente.",
    "contact.altTitle": "¿Prefieres hablar?"
  },

  en: {
    "nav.home": "Home",
    "nav.managers": "Managers",
    "nav.members": "Members",
    "nav.contact": "Contact",
    "cta.requestDemo": "Request demo",
    "cta.freeTrial": "Start free trial",
    "cta.viewFeatures": "See features",
    "cta.getStarted": "Get started",
    "cta.wantApp": "I want the app",
    "cta.contactSales": "Contact sales",

    "hero.title": "PumpUp — Smart management for gyms",
    "hero.lead": "Access control, equipment monitoring and real-time analytics for managers, with a personalized experience for people who train.",

    "dashboard.title": "Benefits by profile",
    "dashboard.subtitle": "Select your role to see tailored features and benefits",
    "tabs.managers": "Managers & Advisors",
    "tabs.members": "People who train",

    "features.title": "What PumpUp offers",
    "features.accessTitle": "Access control",
    "features.accessDesc": "Biometrics, NFC or digital memberships with automatic logging and full traceability.",
    "features.monitorTitle": "Equipment monitoring",
    "features.monitorDesc": "IoT sensors report machine usage, detect overload and optimize maintenance.",
    "features.analyticsTitle": "Analytics & dashboards",
    "features.analyticsDesc": "Real-time insights for operations: occupancy, peak hours and member retention.",

    "segments.title": "Designed for two audiences",
    "segments.mgrTitle": "Gym managers and advisors",
    "segments.mgrDesc": "Tools to streamline operations, cut manual work and get actionable insights. Ideal for owners, managers and consultants focused on efficiency and growth.",
    "segments.memTitle": "People who train",
    "segments.memDesc": "A simple app that shows your visit history, training metrics and recommendations to improve performance and safety.",

    "plans.title": "Plans",
    "plans.subtitle": "Choose the plan that best fits your gym’s needs.",
    "plans.basic.title": "Basic",
    "plans.basic.price": "$29/mo",
    "plans.basic.item1": "Biometric and NFC access control",
    "plans.basic.item2": "Automatic check-in and check-out logging",
    "plans.basic.item3": "Real-time occupancy dashboard",
    "plans.basic.item4": "Standard email support",
    "plans.pro.title": "Pro",
    "plans.pro.price": "$59/mo",
    "plans.pro.item1": "Everything in Basic plan",
    "plans.pro.item2": "IoT equipment monitoring and alerts",
    "plans.pro.item3": "Custom reports and CSV export",
    "plans.pro.item4": "Priority support and guided onboarding",

    "contact.title": "Contact & demo request",
    "contact.subtitle": "Leave your details and we’ll reach out for a personalized demo.",
    "contact.nameLabel": "Name",
    "contact.emailLabel": "Email",
    "contact.roleLabel": "You are?",
    "contact.role.manager": "Manager / Advisor",
    "contact.role.athlete": "Person who trains",
    "contact.messageLabel": "Message",
    "contact.success": "Sent! We will contact you soon.",
    "contact.error": "We couldn’t send your request. Please try again.",
    "contact.altTitle": "Prefer to talk?"
  }
};

// Dashboard specific translations (managers/members detail) - ensure keys exist
I18N.es["dashboard.managers.heading"] = "Visión para gerentes y asesores";
I18N.es["dashboard.managers.desc"] = "Herramientas para optimizar operación, reducir costos y convertir datos en decisiones accionables.";
I18N.es["dashboard.managers.b1.title"] = "Dashboard central:";
I18N.es["dashboard.managers.b1.desc"] = "Aforo, uso de equipos y alertas en un solo lugar.";
I18N.es["dashboard.managers.b2.title"] = "Reportes automatizados:";
I18N.es["dashboard.managers.b2.desc"] = "Exporta CSV y planifica acciones semanales.";
I18N.es["dashboard.managers.b3.title"] = "Mantenimiento predictivo:";
I18N.es["dashboard.managers.b3.desc"] = "Reduce tiempos muertos con alertas de uso inusual.";

I18N.es["dashboard.members.heading"] = "Visión para quien entrena";
I18N.es["dashboard.members.desc"] = "Una experiencia que te ayuda a medir, mejorar y disfrutar tu rutina con seguridad y gamificación.";
I18N.es["dashboard.members.b1.title"] = "Métricas personales:";
I18N.es["dashboard.members.b1.desc"] = "Historial de visitas, calorías y progreso por entrenamiento.";
I18N.es["dashboard.members.b2.title"] = "Reservas y aforo:";
I18N.es["dashboard.members.b2.desc"] = "Reserva máquinas o clases y evita horas pico.";
I18N.es["dashboard.members.b3.title"] = "Logros y retos:";
I18N.es["dashboard.members.b3.desc"] = "Mantén la motivación con badges y retos mensuales.";

I18N.en["dashboard.managers.heading"] = "Vision for managers and advisors";
I18N.en["dashboard.managers.desc"] = "Tools to optimize operations, cut costs and turn data into actionable decisions.";
I18N.en["dashboard.managers.b1.title"] = "Central dashboard:";
I18N.en["dashboard.managers.b1.desc"] = "Occupancy, equipment usage and alerts in a single place.";
I18N.en["dashboard.managers.b2.title"] = "Automated reports:";
I18N.en["dashboard.managers.b2.desc"] = "Export CSV and plan weekly actions.";
I18N.en["dashboard.managers.b3.title"] = "Predictive maintenance:";
I18N.en["dashboard.managers.b3.desc"] = "Reduce downtime with unusual usage alerts.";

I18N.en["dashboard.members.heading"] = "Vision for people who train";
I18N.en["dashboard.members.desc"] = "An experience that helps you measure, improve and enjoy your routine with safety and gamification.";
I18N.en["dashboard.members.b1.title"] = "Personal metrics:";
I18N.en["dashboard.members.b1.desc"] = "Visit history, calories and progress per workout.";
I18N.en["dashboard.members.b2.title"] = "Reservations & occupancy:";
I18N.en["dashboard.members.b2.desc"] = "Reserve machines or classes and avoid peak hours.";
I18N.en["dashboard.members.b3.title"] = "Achievements & challenges:";
I18N.en["dashboard.members.b3.desc"] = "Stay motivated with badges and monthly challenges.";

function applyI18n(lang) {
  const dict = I18N[lang] || I18N.es;
  document.querySelectorAll("[data-i18n]").forEach(node => {
    const key = node.getAttribute("data-i18n");
    if (dict[key]) node.textContent = dict[key];
  });
  document.documentElement.setAttribute("lang", lang);
  localStorage.setItem("lang", lang);
}

(function initLang() {
  const select = document.getElementById("langSwitch");
  const saved = localStorage.getItem("lang") || "es";
  if (select) {
    select.value = saved;
    select.addEventListener("change", () => applyI18n(select.value));
  }
  applyI18n(saved);
})();