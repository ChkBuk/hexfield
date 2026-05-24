// Horizontal slide deck engine for the homepage.
// Captures wheel, touch swipe, keyboard, hash navigation; never traps focus
// inside form inputs; honours prefers-reduced-motion by snapping instead of
// animating; marks off-screen slides `inert` so they're outside the tab order
// and hidden from assistive tech.
//
// Loaded only by SlidesLayout.astro — other pages get no JS.

interface Options {
  /** Min wheel-delta accumulation before advancing. Filters tiny trackpad noise. */
  wheelThreshold: number;
  /** Animation duration in ms. */
  duration: number;
  /** Minimum touch swipe distance to advance. */
  swipeThreshold: number;
}

const DEFAULTS: Options = {
  wheelThreshold: 40,
  duration: 700,
  swipeThreshold: 50,
};

export class SlideEngine {
  private slides: HTMLElement[];
  private currentIndex = 0;
  private isAnimating = false;
  private container: HTMLElement;
  private viewport: HTMLElement;
  private opts: Options;
  private reducedMotion: boolean;
  private wheelAccumulator = 0;
  private wheelResetTimer: number | undefined;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;

  constructor(viewport: HTMLElement, container: HTMLElement, opts: Partial<Options> = {}) {
    this.viewport = viewport;
    this.container = container;
    // Only count elements that are actual slides — `.slide` sections. Pages
    // are free to nest inline <script> blocks (e.g. the contact page's
    // ?error= banner script) inside the layout slot, and those would
    // otherwise be picked up as phantom slides and produce a blank one.
    this.slides = Array.from(container.children).filter(
      (n): n is HTMLElement => n instanceof HTMLElement && n.classList.contains('slide'),
    );
    this.opts = { ...DEFAULTS, ...opts };
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.setupAria();
    this.bind();
    this.applyInitial();
  }

  /** Mark up the carousel for assistive tech. */
  private setupAria(): void {
    this.viewport.setAttribute('aria-roledescription', 'carousel');
    this.slides.forEach((slide, i) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${this.slides.length}`);
    });
  }

  /** Resolve a hash like `#slide-N` or `#some-id` to a valid slide index.
   *  Returns null if the hash isn't a slide reference at all. */
  private hashToIndex(hash: string): number | null {
    const n = /^#slide-(\d+)$/.exec(hash);
    if (n) {
      const idx = parseInt(n[1], 10) - 1;
      return Math.max(0, Math.min(this.slides.length - 1, idx));
    }
    const id = hash.replace(/^#/, '');
    if (!id) return null;
    const target = this.slides.findIndex((s) => s.id === id);
    return target >= 0 ? target : null;
  }

  /** Resolve initial slide from URL hash, default to 0. */
  private applyInitial(): void {
    const idx = this.hashToIndex(window.location.hash);
    if (idx !== null) this.currentIndex = idx;
    this.commit(false);
  }

  /** Remove all global event listeners and cleanup. Called by init()
   *  before constructing a new engine on Astro page-load navs so we
   *  don't leak listeners between SPA navigations. */
  public destroy(): void {
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('hashchange', this.onHashChange);
    window.clearTimeout(this.wheelResetTimer);
  }

  private bind(): void {
    // Wheel — accumulate small deltas so trackpad gestures feel right.
    window.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch — swipe in either axis advances.
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });

    // Keyboard.
    window.addEventListener('keydown', this.onKey);

    // Re-commit on resize so transform stays aligned to slide widths.
    window.addEventListener('resize', this.onResize);

    // Allow back/forward via URL hash.
    window.addEventListener('hashchange', this.onHashChange);

    // Wire any nav controls present in the DOM (dots, prev/next, slide-N buttons).
    document.querySelectorAll<HTMLElement>('[data-slide-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.slideGoto!, 10);
        this.goto(i);
      });
    });
    document.querySelectorAll<HTMLElement>('[data-slide-prev]').forEach((el) => {
      el.addEventListener('click', () => this.prev());
    });
    document.querySelectorAll<HTMLElement>('[data-slide-next]').forEach((el) => {
      el.addEventListener('click', () => this.next());
    });
  }

  private onWheel = (e: WheelEvent): void => {
    if (this.isInputFocused()) return;
    if (this.isAnimating) { e.preventDefault(); return; }
    const dominant = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(dominant) < 2) return;
    e.preventDefault();
    this.wheelAccumulator += dominant;
    window.clearTimeout(this.wheelResetTimer);
    this.wheelResetTimer = window.setTimeout(() => { this.wheelAccumulator = 0; }, 220);
    if (Math.abs(this.wheelAccumulator) > this.opts.wheelThreshold) {
      this.wheelAccumulator > 0 ? this.next() : this.prev();
      this.wheelAccumulator = 0;
    }
  };

  private onTouchStart = (e: TouchEvent): void => {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.touchStartTime = Date.now();
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (this.isInputFocused()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    const dt = Date.now() - this.touchStartTime;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < this.opts.swipeThreshold) return; // tap
    if (dt > 700) return;                                          // too slow

    // Horizontal swipe — always navigate (regardless of vertical scroll state).
    if (absX > absY) {
      dx < 0 ? this.next() : this.prev();
      return;
    }

    // Vertical swipe — only navigate when at a scroll boundary:
    //   • slide scrolled to BOTTOM + swipe up   → advance to next slide
    //   • slide scrolled to TOP    + swipe down → go to previous slide
    // Otherwise the native scroll has already handled the drag.
    const slide = this.slides[this.currentIndex];
    const atTop    = slide.scrollTop <= 1;
    const atBottom = slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 1;

    if (dy < 0 && atBottom) {
      this.next();
    } else if (dy > 0 && atTop) {
      this.prev();
    }
  };

  private onKey = (e: KeyboardEvent): void => {
    if (this.isInputFocused()) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        this.next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        this.prev();
        break;
      case 'Home':
        e.preventDefault();
        this.goto(0);
        break;
      case 'End':
        e.preventDefault();
        this.goto(this.slides.length - 1);
        break;
    }
  };

  private onResize = (): void => { this.commit(false); };

  private onHashChange = (): void => {
    const idx = this.hashToIndex(window.location.hash);
    if (idx !== null) this.goto(idx);
  };

  private isInputFocused(): boolean {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  next(): void { this.goto(this.currentIndex + 1); }
  prev(): void { this.goto(this.currentIndex - 1); }

  goto(idx: number): void {
    const target = Math.max(0, Math.min(this.slides.length - 1, idx));
    if (target === this.currentIndex) return;
    this.currentIndex = target;
    this.commit(true);
  }

  /** Apply the current index to the DOM. */
  private commit(animate: boolean): void {
    const shouldAnimate = animate && !this.reducedMotion;
    this.isAnimating = shouldAnimate;
    this.container.style.transition = shouldAnimate
      ? `transform ${this.opts.duration}ms cubic-bezier(0.7, 0, 0.25, 1)`
      : 'none';
    this.container.style.transform = `translate3d(-${this.currentIndex * 100}vw, 0, 0)`;

    // Hide off-screen slides from tab order + AT.
    this.slides.forEach((s, i) => {
      const isCurrent = i === this.currentIndex;
      if (isCurrent) {
        s.removeAttribute('inert');
        s.removeAttribute('aria-hidden');
      } else {
        s.setAttribute('inert', '');
        s.setAttribute('aria-hidden', 'true');
      }
    });

    // Sync nav dots / prev-next disabled state. Read the target index from
    // each element's data-slide-goto attribute — NOT the iteration index —
    // because `[data-slide-goto]` also matches in-page CTAs (e.g. the
    // "Send a message" button on /contact/ uses data-slide-goto="1"), which
    // would otherwise shift every dot's aria-current by one.
    document.querySelectorAll<HTMLElement>('[data-slide-goto]').forEach((el) => {
      const target = parseInt(el.dataset.slideGoto!, 10);
      el.setAttribute('aria-current', target === this.currentIndex ? 'true' : 'false');
    });
    document.querySelectorAll<HTMLButtonElement>('[data-slide-prev]').forEach((el) => {
      el.toggleAttribute('disabled', this.currentIndex === 0);
    });
    document.querySelectorAll<HTMLButtonElement>('[data-slide-next]').forEach((el) => {
      el.toggleAttribute('disabled', this.currentIndex === this.slides.length - 1);
    });

    // Update slide counter labels.
    document.querySelectorAll<HTMLElement>('[data-slide-counter]').forEach((el) => {
      const total = String(this.slides.length).padStart(2, '0');
      const current = String(this.currentIndex + 1).padStart(2, '0');
      el.textContent = `${current} / ${total}`;
    });

    // Update URL hash without re-triggering hashchange.
    const newHash = `#slide-${this.currentIndex + 1}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }

    // Mirror the active slide's background variant on <body> so the fixed
    // header/footer can invert over dark slides. We read the `data-variant`
    // attribute that each <section class="slide"> declares.
    const current = this.slides[this.currentIndex];
    const variant = current?.dataset.variant ?? 'light';
    document.body.classList.toggle('slide-dark-active', variant === 'dark');
    document.body.classList.toggle('slide-tint-active', variant === 'tint');

    // Dynamically update <meta name="theme-color"> so the iOS/Chrome mobile
    // status bar matches the active slide colour. This also affects the
    // pull-to-refresh overlay colour on Chrome Android.
    const themeColor =
      variant === 'dark' ? '#0F1014' :
      variant === 'tint' ? '#C8F031' :
      '#FFFFFF';
    let metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.name = 'theme-color';
      document.head.appendChild(metaTheme);
    }
    metaTheme.content = themeColor;

    // Notify subscribers (analytics, future hero motion, …) that the active
    // slide changed. Listeners receive { index, total, variant, animate }.
    window.dispatchEvent(new CustomEvent('hexfield:slidechange', {
      detail: {
        index: this.currentIndex,
        total: this.slides.length,
        variant,
        animate: shouldAnimate,
      },
    }));

    if (shouldAnimate) {
      window.setTimeout(() => { this.isAnimating = false; }, this.opts.duration);
    }
  }
}

// Auto-bootstrap when a viewport + container exist in the DOM.
// Runs on first load AND after every Astro View Transition nav
// (astro:page-load fires both times). Stores the engine on window so
// the previous instance can be destroyed before constructing a new one
// — otherwise wheel/touch/key listeners accumulate across navigations.
declare global {
  interface Window { __hexfieldSlideEngine?: SlideEngine }
}

function init(): void {
  window.__hexfieldSlideEngine?.destroy();
  window.__hexfieldSlideEngine = undefined;

  const viewport = document.querySelector<HTMLElement>('[data-slides-viewport]');
  const container = document.querySelector<HTMLElement>('[data-slides-container]');
  if (!viewport || !container) return;
  window.__hexfieldSlideEngine = new SlideEngine(viewport, container);
}

document.addEventListener('astro:page-load', init);

// Fallback for the very first load before Astro's runtime has wired up.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
