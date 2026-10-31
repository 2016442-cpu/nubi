'use strict';

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const header = document.querySelector('.site-header');
const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
const year = document.getElementById('current-year');

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    mainNav.classList.toggle('open', !isOpen);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menú');
    });
  });
}

const updateHeader = () => {
  if (header) header.classList.toggle('scrolled', window.scrollY > 12);
};
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

// Reveal sections as they enter the viewport; content stays visible when reduced motion is preferred.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Highlight the current section in the desktop navigation.
const sectionLinks = navLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

if ('IntersectionObserver' in window && sectionLinks.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach(({ link, section }) => {
        if (section === entry.target) link.classList.add('active');
        else link.classList.remove('active');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sectionLinks.forEach(({ section }) => sectionObserver.observe(section));
}


// Nubi, la mascota: va comentando según la sección que estés viendo.
// Si la cierras con la ×, deja de hablar hasta que le des clic otra vez.
(() => {
  const guide = document.getElementById('nubi-guide');
  if (!guide) return;
  const bubble = document.getElementById('nubi-bubble');
  const text = document.getElementById('nubi-text');
  const button = document.getElementById('nubi-button');
  const closeButton = document.getElementById('nubi-close');

  const sectionMessages = [
    ['.hero', '¡Hola! Soy Nubi y te acompaño en este recorrido.'],
    ['#nosotros', 'NubiLearn nace de una pregunta: ¿cómo apoyar el aprendizaje también en casa?'],
    ['#idea', 'Cada niño aprende diferente, y yo estoy aquí para acompañar.'],
    ['.goals-section', 'Practicar, ver avances y conectar a familias y docentes: eso queremos lograr.'],
    ['#funciones', 'Estas son las funciones de la app. ¡Todavía la estamos construyendo!'],
    ['.tech-section', 'Con estas herramientas estamos dando vida a la app.'],
    ['.workflow-section', 'Desarrollar una app es trabajo en equipo.'],
    ['#equipo', 'Ellos son quienes me dieron vida.'],
    ['#cierre', '¡Gracias por visitarnos! Practica. Aprende. Progresa.']
  ];
  const tips = [
    'Cada niño aprende a su ritmo, y por eso existe NubiLearn.',
    'Practica. Aprende. Progresa.',
    'La app todavía está en construcción, ¡pero vamos con todo!',
    'Las familias y los docentes también son parte del camino.',
    '¡Gracias por pasar a saludarme!'
  ];

  let muted = false;
  let hideTimer;
  let tipIndex = 0;
  try { muted = localStorage.getItem('nubi-muted') === '1'; } catch (error) { /* sin almacenamiento */ }

  const hide = () => {
    bubble.classList.remove('show');
    button.classList.remove('talking');
  };
  const say = (message, force = false) => {
    if (muted && !force) return;
    text.textContent = message;
    bubble.classList.add('show');
    button.classList.remove('talking');
    void button.offsetWidth;
    button.classList.add('talking');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 6500);
  };

  button.addEventListener('click', () => {
    muted = false;
    try { localStorage.setItem('nubi-muted', '0'); } catch (error) { /* sin almacenamiento */ }
    say(tips[tipIndex++ % tips.length], true);
  });
  closeButton.addEventListener('click', () => {
    muted = true;
    try { localStorage.setItem('nubi-muted', '1'); } catch (error) { /* sin almacenamiento */ }
    clearTimeout(hideTimer);
    hide();
  });

  if ('IntersectionObserver' in window) {
    let ready = false;
    setTimeout(() => { ready = true; }, 1200);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = sectionMessages.find(([selector]) => document.querySelector(selector) === entry.target);
        if (!item) return;
        if (!ready) { setTimeout(() => say(item[1]), 1200); return; }
        say(item[1]);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionMessages.forEach(([selector]) => {
      const section = document.querySelector(selector);
      if (section) observer.observe(section);
    });
  }
})();


// Menú: la pastilla de color se desliza hasta la opción en la que pasas el mouse
// (o hasta la sección que estás viendo).
(() => {
  const pill = document.querySelector('.nav-pill');
  if (!pill) return;
  const blob = pill.querySelector('.nav-blob');
  const links = [...pill.querySelectorAll('a')];
  const desktop = window.matchMedia('(min-width: 821px)');
  let hovered = null;

  const place = (link) => {
    links.forEach((item) => item.classList.toggle('is-under', item === link && desktop.matches));
    if (!link || !desktop.matches) { blob.style.opacity = '0'; return; }
    const firstTime = blob.style.opacity !== '1';
    if (firstTime) blob.style.transition = 'none';
    blob.style.width = link.offsetWidth + 'px';
    blob.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    blob.style.background = 'var(--' + (link.dataset.color || 'yellow') + ')';
    blob.style.opacity = '1';
    if (firstTime) { void blob.offsetWidth; blob.style.transition = ''; }
  };
  const current = () => hovered || links.find((item) => item.classList.contains('active')) || null;
  const refresh = () => place(current());

  links.forEach((link) => {
    link.addEventListener('mouseenter', () => { hovered = link; refresh(); });
    link.addEventListener('focus', () => { hovered = link; refresh(); });
    link.addEventListener('blur', () => { hovered = null; refresh(); });
  });
  pill.addEventListener('mouseleave', () => { hovered = null; refresh(); });
  new MutationObserver(refresh).observe(pill, { attributes: true, attributeFilter: ['class'], subtree: true });
  window.addEventListener('resize', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  refresh();
})();
