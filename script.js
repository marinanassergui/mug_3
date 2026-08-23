document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hero-media video, .ticker-media video').forEach((video) => {
    video.play().catch(() => {
      /* autoplay blocked — video stays paused on first frame, no-op */
    });
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initHeroShowcase(prefersReducedMotion);
  initProcess(prefersReducedMotion);
  initCases(prefersReducedMotion);
  initClosing(prefersReducedMotion);
  initNavAutoHide();
});

// Reveals `el` (adds the "is-visible" class) once it scrolls within
// `thresholdFraction` of the viewport height. Driven by a scroll listener +
// rAF rather than IntersectionObserver, which has proven unreliable for
// these entrance reveals in the wild.
function revealOnScroll(el, thresholdFraction) {
  if (!el) return;

  const fraction = thresholdFraction === undefined ? 0.85 : thresholdFraction;
  let revealed = false;
  let ticking = false;

  const check = () => {
    if (!revealed) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * fraction && rect.bottom > 0) {
        revealed = true;
        el.classList.add('is-visible');
        window.removeEventListener('scroll', onScroll);
      }
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(check);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  check();
}

function initHeroShowcase(prefersReducedMotion) {
  const caption = document.querySelector('.showcase-caption');
  const heroShowcase = document.querySelector('.hero-showcase');
  const heroMedia = document.querySelector('.hero-media');
  const fadeEls = [document.querySelector('.hero-title'), document.querySelector('.hero-sub')].filter(Boolean);
  const overlay = document.querySelector('.showcase-overlay');

  if (!heroShowcase || !heroMedia) return;

  if (prefersReducedMotion) {
    fadeEls.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  const DWELL_VH = 40; // scroll room before the video starts growing
  const GROW_VH = 130; // scroll room across which the video grows to fullscreen

  let restRect = null; // hero-media's rect while still in normal flow
  let ticking = false;

  // hero-sub uses a one-time CSS transition (with delay) for its page-load
  // entrance. Once that's had time to finish, drop the transition so every
  // later scroll-driven opacity change applies instantly, in lockstep with
  // scroll — otherwise each frame's tiny change re-triggers the delayed
  // transition and the element never visually catches up to its target.
  const heroSubEl = document.querySelector('.hero-sub');
  if (heroSubEl) {
    window.setTimeout(() => {
      heroSubEl.style.transition = 'none';
    }, 1900);
  }

  const captureRestRect = () => {
    if (!heroMedia.classList.contains('is-fixed')) {
      restRect = heroMedia.getBoundingClientRect();
    }
  };

  const update = () => {
    const containerRect = heroShowcase.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const offset = Math.max(-containerRect.top, 0);

    const dwellPx = (DWELL_VH / 100) * viewportH;
    const growPx = (GROW_VH / 100) * viewportH;
    const totalScrollRoom = heroShowcase.offsetHeight - viewportH;
    const growEndPx = dwellPx + growPx;

    const inGrowZone = offset > dwellPx && offset <= totalScrollRoom;
    const growProgress = growPx > 0 ? Math.min(Math.max((offset - dwellPx) / growPx, 0), 1) : 1;

    // Once fully grown, hold fullscreen for a while, then fade the whole
    // scene out before the section ends — so the exit never shows the
    // hero content shrinking back into view.
    let mediaOpacity = 1;
    if (offset > growEndPx) {
      const holdRoom = totalScrollRoom - growEndPx;
      const holdProgress = holdRoom > 0 ? Math.min(Math.max((offset - growEndPx) / holdRoom, 0), 1) : 1;
      const fadeStart = 0.6;
      mediaOpacity = holdProgress < fadeStart ? 1 : Math.max(1 - (holdProgress - fadeStart) / (1 - fadeStart), 0);
    }

    if (inGrowZone) {
      if (!heroMedia.classList.contains('is-fixed')) {
        if (!restRect) captureRestRect();
        heroMedia.classList.add('is-fixed');
      }

      const start = restRect || { top: 0, left: 0, width: viewportW, height: viewportH };
      const top = start.top + (0 - start.top) * growProgress;
      const left = start.left + (0 - start.left) * growProgress;
      const width = start.width + (viewportW - start.width) * growProgress;
      const height = start.height + (viewportH - start.height) * growProgress;

      heroMedia.style.top = `${top.toFixed(1)}px`;
      heroMedia.style.left = `${left.toFixed(1)}px`;
      heroMedia.style.width = `${width.toFixed(1)}px`;
      heroMedia.style.height = `${height.toFixed(1)}px`;
    } else if (heroMedia.classList.contains('is-fixed')) {
      heroMedia.classList.remove('is-fixed');
      heroMedia.style.top = '';
      heroMedia.style.left = '';
      heroMedia.style.width = '';
      heroMedia.style.height = '';
    }

    heroMedia.style.opacity = String(mediaOpacity);

    const fadeOpacity = String(Math.max(1 - growProgress / 0.4, 0));
    const fadeTransform = `translateY(${(-growProgress * 40).toFixed(1)}px)`;
    fadeEls.forEach((el) => {
      el.style.opacity = fadeOpacity;
      el.style.transform = fadeTransform;
    });

    if (overlay) {
      overlay.style.opacity = String(growProgress * mediaOpacity);
    }

    if (caption) {
      if (growProgress > 0.82 && mediaOpacity > 0.5) {
        caption.classList.add('is-visible');
      } else {
        caption.classList.remove('is-visible');
      }
    }

    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', () => {
    if (!heroMedia.classList.contains('is-fixed')) captureRestRect();
    update();
  });

  captureRestRect();
  update();
}

function initProcess(prefersReducedMotion) {
  const section = document.querySelector('.process');
  const pin = document.querySelector('.process-pin');
  const intro = document.querySelector('.process-intro');
  const cards = Array.from(document.querySelectorAll('.process-card'));

  if (!section || !pin || cards.length === 0) return;

  if (intro) {
    if (prefersReducedMotion) {
      intro.classList.add('is-visible');
    } else {
      revealOnScroll(intro, 0.8);
    }
  }

  const isMobileLayout = window.matchMedia('(max-width: 768px)').matches;

  // On mobile the section is a plain stacked layout (see the CSS), not the
  // pinned scroll-swap effect — running the swap JS on top of it fights the
  // mobile CSS (the .is-leaving transform still wins on specificity) and
  // shifts cards over each other. Skip it entirely there.
  if (cards.length < 2 || prefersReducedMotion || isMobileLayout) return;

  const CARD_VH = 100; // scroll distance per card transition
  section.style.height = `${(100 + (cards.length - 1) * CARD_VH).toFixed(0)}dvh`;

  let ticking = false;

  const update = () => {
    const rect = section.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const offset = Math.max(-rect.top, 0);
    const perCard = viewportH;
    const activeIndex = Math.min(Math.floor(offset / perCard), cards.length - 1);

    cards.forEach((card, i) => {
      card.classList.toggle('is-active', i === activeIndex);
      card.classList.toggle('is-leaving', i < activeIndex);
    });

    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', update);

  update();
}

function initCases(prefersReducedMotion) {
  const title = document.querySelector('.cases-title');
  const carousel = document.querySelector('.cases-carousel');

  if (!title && !carousel) return;

  if (prefersReducedMotion) {
    if (title) title.classList.add('is-visible');
    if (carousel) carousel.classList.add('is-visible');
    return;
  }

  revealOnScroll(title, 0.8);
  revealOnScroll(carousel, 0.85);
}

function initClosing(prefersReducedMotion) {
  const top = document.querySelector('.closing-top');
  const wordmark = document.querySelector('.closing-wordmark');

  if (!top && !wordmark) return;

  if (prefersReducedMotion) {
    if (top) top.classList.add('is-visible');
    if (wordmark) wordmark.classList.add('is-visible');
    return;
  }

  const anchor = top || wordmark;
  if (!anchor) return;

  let revealed = false;
  let ticking = false;

  const check = () => {
    if (!revealed) {
      const rect = anchor.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        revealed = true;
        if (top) top.classList.add('is-visible');
        if (wordmark) wordmark.classList.add('is-visible');
        window.removeEventListener('scroll', onScroll);
      }
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(check);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  check();
}

function initNavAutoHide() {
  const nav = document.querySelector('.nav');
  const closing = document.querySelector('.closing');

  if (!nav || !closing) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        nav.classList.toggle('is-hidden', entry.isIntersecting);
      });
    },
    { threshold: 0.05 }
  );
  observer.observe(closing);
}
