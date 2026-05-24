// Page-motion driver: loading bar + slide-reveal + scroll-reveal.
//
// Loaded by SlidesLayout (and BaseLayout) as a module. Subscribes to:
//   • astro:before-preparation / astro:page-load — Astro View Transitions
//     events for the top loading bar.
//   • hexfield:slidechange — fired by slide-engine.ts when the active slide
//     changes; toggles the `.is-active` class so the slide's content
//     animates in.
//   • IntersectionObserver — for [data-reveal] elements on static pages.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Loader ─────────────────────────────────────────────────────────
function getLoader(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-page-loader]');
}

function showLoader(): void {
  const el = getLoader();
  if (!el) return;
  el.classList.remove('is-done');
  // Reset width first so the transition re-fires every navigation.
  el.style.width = '0';
  el.offsetHeight; // force reflow
  el.style.width = '';
  el.classList.add('is-loading');
}

function hideLoader(): void {
  const el = getLoader();
  if (!el) return;
  el.classList.remove('is-loading');
  el.classList.add('is-done');
  window.setTimeout(() => {
    el.classList.remove('is-done');
    el.style.width = '0';
  }, 500);
}

document.addEventListener('astro:before-preparation', showLoader);
document.addEventListener('astro:page-load', hideLoader);

// Edge case: first ever load (no Astro nav event fires before it). Show
// a brief flash so users get the loading affordance on cold load too.
if (!reducedMotion && document.readyState === 'loading') {
  showLoader();
  window.addEventListener('load', hideLoader, { once: true });
}

// ── Slide-content reveal ───────────────────────────────────────────
// On slide-deck pages, mark the currently-active slide with `.is-active`
// so its content animates in. Initial slide reveals as soon as the
// engine commits, subsequent slides on every slidechange event.
function markActiveSlide(index: number): void {
  document.querySelectorAll<HTMLElement>('.slide').forEach((s, i) => {
    s.classList.toggle('is-active', i === index);
  });
}

window.addEventListener('hexfield:slidechange', (e: Event) => {
  const detail = (e as CustomEvent<{ index: number }>).detail;
  if (detail && typeof detail.index === 'number') {
    markActiveSlide(detail.index);
    // Hide the scroll hint once the user has actually advanced past slide 1.
    // (We also hide on any scroll inside a slide — handled below.)
    const hint = document.querySelector<HTMLElement>('[data-scroll-hint]');
    if (hint) hint.classList.toggle('is-hidden', detail.index > 0);
  }
});

// Hide the scroll hint as soon as the user starts scrolling inside slide 1.
// This catches the case where the user has scrolled but hasn't yet advanced.
function bindScrollHintAutoHide(): void {
  const hint = document.querySelector<HTMLElement>('[data-scroll-hint]');
  if (!hint) return;
  const slides = document.querySelectorAll<HTMLElement>('.slide');
  slides.forEach((slide) => {
    slide.addEventListener('scroll', () => {
      if (slide.scrollTop > 40) hint.classList.add('is-hidden');
    }, { passive: true });
  });
  // Clicking the hint scrolls the active slide down by one viewport.
  hint.addEventListener('click', () => {
    const active = document.querySelector<HTMLElement>('.slide.is-active') ?? slides[0];
    if (active) active.scrollBy({ top: active.clientHeight * 0.8, behavior: 'smooth' });
  });
}

// Initial: when the page loads, the first slide should reveal too.
// We wait one frame so the slide engine has dispatched its initial
// commit (if it's going to). If no event arrives, default to slide 0.
function initSlideReveal(): void {
  const slides = document.querySelectorAll<HTMLElement>('.slide');
  if (slides.length === 0) return;
  // If something's already active (slide engine fired during init), respect it.
  if (document.querySelector('.slide.is-active')) return;
  markActiveSlide(0);
}

// ── Scroll-reveal for static pages ─────────────────────────────────
// Auto-tag the major content blocks (headings, paragraphs, lists, tables)
// inside <main> on static pages. We do this in JS so authors don't have
// to remember to add data-reveal everywhere. Elements already marked
// data-reveal in markup are preserved (an opt-in escape hatch).
const AUTO_REVEAL_SELECTOR =
  'main h1, main h2, main h3, main p, main ul, main ol, main blockquote, ' +
  'main table, main figure, main pre, main .card, main section > *';

function initScrollReveal(): void {
  const candidates = document.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR);
  const vh = window.innerHeight;

  candidates.forEach((el) => {
    if (el.closest('.slide')) return;            // slide-deck uses its own reveal
    if (el.hasAttribute('data-reveal')) return;  // already opted-in

    // Tag + classify atomically so we don't flash visible-then-hidden.
    // Anything already in the viewport (above the fold) goes straight to
    // .is-visible; everything below the fold starts hidden and the
    // observer will reveal it on scroll.
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < vh && rect.bottom > 0;
    el.setAttribute('data-reveal', '');
    if (inViewport) el.classList.add('is-visible');
  });

  // Manually tagged + still-hidden elements both need observing.
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)');
  if (els.length === 0) return;
  if (reducedMotion) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  els.forEach((el) => io.observe(el));
}

// Run on initial load + after every View Transition (astro:page-load
// fires for both the first load and SPA navigations).
document.addEventListener('astro:page-load', () => {
  initSlideReveal();
  initScrollReveal();
  bindScrollHintAutoHide();
});

// Also handle the very first load before astro:page-load has wired up.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSlideReveal();
    initScrollReveal();
    bindScrollHintAutoHide();
  });
} else {
  initSlideReveal();
  initScrollReveal();
  bindScrollHintAutoHide();
}
