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
  }
});

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
function initScrollReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
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
});

// Also handle the very first load before astro:page-load has wired up.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSlideReveal();
    initScrollReveal();
  });
} else {
  initSlideReveal();
  initScrollReveal();
}
