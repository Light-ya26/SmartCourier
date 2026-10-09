/**
 * SmartCourier – Global UI & Layout JavaScript (main.js)
 * -------------------------------------------------------------
 * Responsible exclusively for global UI and layout interactions:
 * - Mobile sidebar toggle & offcanvas backdrop
 * - Active navigation state management
 * - Header profile & notification dropdowns
 * - Logout button behavior
 * - Search bar focus shortcuts
 * - Lightweight UI toast alerts
 * -------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   DOM Helper Functions
   ========================================================================== */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ==========================================================================
   1. Mobile Sidebar Toggle & Offcanvas Behavior
   ========================================================================== */
function initSidebar() {
  const toggleBtn = $('.sidebar-toggle-btn');
  const sidebar = $('.sidebar');
  const backdrop = $('.sidebar-backdrop');

  if (!toggleBtn || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Close sidebar on pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // Close sidebar when clicking links on mobile
  $$('.sidebar .nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 991) {
        closeSidebar();
      }
    });
  });
}

/* ==========================================================================
   2. Active Navigation State
   ========================================================================== */
function initActiveNav() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = $$('.sidebar .nav-link');

  // Match current URL if navigating between pages
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && currentPath.endsWith(href.toLowerCase())) {
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
    }

    // Interactive switch for template previewing
    link.addEventListener('click', function (e) {
      if (this.getAttribute('href') === '#' || this.getAttribute('href')?.startsWith('javascript')) {
        e.preventDefault();
        navLinks.forEach((l) => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   3. Header Dropdowns (Profile & Notifications)
   ========================================================================== */
function initDropdowns() {
  const profileBtn = $('.user-profile-btn');
  const profileMenu = $('#profileDropdownMenu');

  const notifBtn = $('.notification-btn');
  const notifMenu = $('#notificationDropdownMenu');

  function closeAllDropdowns() {
    if (profileMenu) profileMenu.classList.remove('show');
    if (notifMenu) notifMenu.classList.remove('show');
  }

  // Profile Dropdown Toggle
  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = profileMenu.classList.contains('show');
      closeAllDropdowns();
      if (!isOpen) profileMenu.classList.add('show');
    });
  }

  // Notification Dropdown Toggle
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifMenu.classList.contains('show');
      closeAllDropdowns();
      if (!isOpen) notifMenu.classList.add('show');
    });
  }

  // Click outside to close dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-profile-menu') && !e.target.closest('.notification-container')) {
      closeAllDropdowns();
    }
  });

  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
  });
}

/* ==========================================================================
   4. Logout Action Behavior
   ========================================================================== */
function initLogoutBehavior() {
  const logoutButtons = $$('[data-action="logout"], .logout-trigger');

  logoutButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Clear session storage immediately without blocking browser popups
      try {
        localStorage.removeItem('sc_user');
        localStorage.removeItem('sc_token');
      } catch (_) {}

      showToast('You have been signed out successfully.', 'info');

      // Redirect to login page gracefully
      setTimeout(() => {
        const isSubdir = /[\\/](admin|driver)[\\/]/.test(window.location.pathname) ||
          window.location.pathname.includes('/admin/') ||
          window.location.pathname.includes('/driver/');
        window.location.href = isSubdir ? '../login.html' : 'login.html';
      }, 400);
    });
  });
}

/* ==========================================================================
   5. Search Shortcut (Ctrl+K or Cmd+K)
   ========================================================================== */
function initSearchShortcut() {
  const searchInput = $('.header-search-input');
  if (!searchInput) return;

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

/* ==========================================================================
   6. UI Toast Notification Helper
   ========================================================================== */
function showToast(message, type = 'info') {
  let toastContainer = $('#sc-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'sc-toast-container';
    Object.assign(toastContainer.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '1090',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
      maxWidth: '380px',
    });
    document.body.appendChild(toastContainer);
  }

  const iconClass =
    type === 'success'
      ? 'bi-check-circle-fill text-success'
      : type === 'danger'
      ? 'bi-x-circle-fill text-danger'
      : type === 'warning'
      ? 'bi-exclamation-triangle-fill text-warning'
      : 'bi-info-circle-fill text-primary';

  const badgeTypeClass =
    type === 'success'
      ? 'status-badge-success'
      : type === 'danger'
      ? 'status-badge-danger'
      : type === 'warning'
      ? 'status-badge-warning'
      : 'status-badge-info';

  const toast = document.createElement('div');
  toast.className = `status-badge ${badgeTypeClass} shadow-sm`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  Object.assign(toast.style, {
    padding: '0.65rem 1.15rem',
    fontSize: '0.8125rem',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-md)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    opacity: '0',
    transform: 'translateY(10px)',
    transition: 'all 0.25s ease',
    pointerEvents: 'auto',
  });

  toast.innerHTML = `<i class="bi ${iconClass} fs-6 flex-shrink-0"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3500);
}

/* ==========================================================================
   Initialize Global UI on DOM Load
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initActiveNav();
  initDropdowns();
  initLogoutBehavior();
  initSearchShortcut();
});
