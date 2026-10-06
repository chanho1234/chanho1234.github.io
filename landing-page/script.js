/**
 * Joie i-Spin 360 Landing Page Interaction Script
 * Clean Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initAnalyticsTracking();
  initMobileMenu();
  initAccordion();
  initAdacInfoToggle();
  initImageFallback();
  initHeaderScrollEffect();
});

/**
 * GA4 section and CTA measurement.
 * Uses the page's existing Google tag and does not affect CTA navigation.
 */
function initAnalyticsTracking() {
  const trackingKey = '__joieLandingAnalyticsTracking';

  if (window[trackingKey]?.initialized) return;

  const trackingState = {
    initialized: true,
    sentSections: new Set(),
    observer: null
  };
  window[trackingKey] = trackingState;

  const sectionTargets = [
    { id: 'hero-title', sectionName: 'hero' },
    { id: 'detail-space-title', sectionName: 'detail' },
    { id: 'purchase-title', sectionName: 'cta' }
  ].map(({ id, sectionName }) => ({ element: document.getElementById(id), sectionName }))
    .filter(({ element }) => element);

  function sendEvent(eventName, parameters) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
    }
  }

  function recordSectionView(target) {
    if (trackingState.sentSections.has(target.sectionName)) return;

    trackingState.sentSections.add(target.sectionName);
    sendEvent('section_view', { section_name: target.sectionName });

    if (trackingState.observer) {
      trackingState.observer.unobserve(target.element);
    }
  }

  function getHeaderHeight() {
    const header = document.getElementById('site-header');
    return header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  }

  function isAtLeastHalfVisible(element) {
    const rect = element.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, getHeaderHeight());
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    return rect.height > 0 && visibleHeight / rect.height >= 0.5;
  }

  function checkVisibleSectionTitles() {
    if (document.visibilityState !== 'visible') return;

    sectionTargets.forEach((target) => {
      if (!trackingState.sentSections.has(target.sectionName) && isAtLeastHalfVisible(target.element)) {
        recordSectionView(target);
      }
    });
  }

  function observeSectionTitles() {
    if (!('IntersectionObserver' in window)) {
      checkVisibleSectionTitles();
      return;
    }

    const headerHeight = getHeaderHeight();
    trackingState.observer = new IntersectionObserver((entries) => {
      if (document.visibilityState !== 'visible') return;

      entries.forEach((entry) => {
        const target = sectionTargets.find(({ element }) => element === entry.target);
        if (target && entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          recordSectionView(target);
        }
      });
    }, {
      root: null,
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
      threshold: [0.5]
    });

    sectionTargets.forEach(({ element }) => trackingState.observer.observe(element));
    checkVisibleSectionTitles();
  }

  const ctaButtons = [...new Set([
    ...document.querySelectorAll('#cta-hero, [data-cta-location="hero"]'),
    ...document.querySelectorAll('#cta-final, [data-cta-location="final"]')
  ])];

  ctaButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const buttonLocation = button.dataset.ctaLocation || (button.id === 'cta-hero' ? 'hero' : 'final');
      sendEvent('cta_click', { button_location: buttonLocation });
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkVisibleSectionTitles();
    }
  });

  observeSectionTitles();
}

/**
 * 1. Mobile Menu Navigation
 * - Hamburger toggle button
 * - Closes on link click, outside click, and Escape key
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const siteNav = document.getElementById('site-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !siteNav) return;

  function openMenu() {
    toggleBtn.setAttribute('aria-expanded', 'true');
    siteNav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    toggleBtn.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when nav link is clicked
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeMenu();
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (
      toggleBtn.getAttribute('aria-expanded') === 'true' &&
      !siteNav.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggleBtn.focus();
    }
  });

  // Reset menu state on window resize past mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && toggleBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });
}

/**
 * 3. FAQ Accordion
 * - Accessible with Enter/Space
 * - PC: Allows multiple open items
 * - Mobile (<= 768px): One open item at a time (closes previous)
 */
function initAccordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      const contentId = trigger.getAttribute('aria-controls');
      const content = document.getElementById(contentId);
      const currentItem = trigger.closest('.accordion-item');

      if (!content || !currentItem) return;

      const isMobile = window.innerWidth <= 768;

      // In mobile, close other items when opening a new one
      if (isMobile && !isExpanded) {
        triggers.forEach((otherTrigger) => {
          if (otherTrigger !== trigger) {
            const otherContentId = otherTrigger.getAttribute('aria-controls');
            const otherContent = document.getElementById(otherContentId);
            const otherItem = otherTrigger.closest('.accordion-item');

            otherTrigger.setAttribute('aria-expanded', 'false');
            if (otherContent) otherContent.hidden = true;
            if (otherItem) otherItem.classList.remove('is-open');
          }
        });
      }

      // Toggle current item
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        content.hidden = true;
        currentItem.classList.remove('is-open');
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        content.hidden = false;
        currentItem.classList.add('is-open');
      }
    });
  });
}

/**
 * 4. ADAC Info Popover Toggle
 * - Toggles explanatory note: "2019년 10월 테스트 결과"
 * - Closes on outside click & Escape
 */
function initAdacInfoToggle() {
  const btn = document.querySelector('.info-toggle-btn');
  const panel = document.getElementById('adac-info-panel');

  if (!btn || !panel) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    } else {
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    }
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      btn.focus();
    }
  });
}

/**
 * 5. Image Fallback Handling
 * - "상품 사진이 없으면 '이미지 준비 중'으로 표시"
 * - Handles both load errors and missing images gracefully
 */
function initImageFallback() {
  const images = document.querySelectorAll('img');

  images.forEach((img) => {
    function applyFallback() {
      img.style.display = 'none';
      const parent = img.parentElement;
      if (parent) {
        let fallback = parent.querySelector('.image-fallback');
        if (!fallback) {
          fallback = document.createElement('div');
          fallback.className = 'image-fallback';
          fallback.textContent = '이미지 준비 중';
          parent.appendChild(fallback);
        }
        fallback.classList.add('is-active');
      }
    }

    img.addEventListener('error', applyFallback);

    // If image is already broken upon execution
    if (img.complete && img.naturalWidth === 0) {
      applyFallback();
    }
  });
}

/**
 * 6. Header Elevation on Scroll
 */
function initHeaderScrollEffect() {
  const header = document.getElementById('site-header');
  if (!header) return;

  function updateHeader() {
    if (window.scrollY > 20) {
      header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
      header.style.borderBottomColor = 'rgba(22, 24, 27, 0.1)';
    } else {
      header.style.boxShadow = 'none';
      header.style.borderBottomColor = 'rgba(22, 24, 27, 0.06)';
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}
