/**
 * SmartCourier – Frontend Authentication Module (auth.js)
 * --------------------------------------------------------------------------
 * Handles:
 * 1. Form input validation (required fields, password minimum length)
 * 2. Password visibility toggle (show / hide with accessible state)
 * 3. Informational "Forgot Password" notice
 * 4. Isolated mock demo authentication for college project presentation
 * 5. Role-based redirection (Admin -> admin/dashboard.html, Driver -> driver/dashboard.html)
 * --------------------------------------------------------------------------
 * NOTE: Real authentication will be integrated here later via the ASP.NET
 * Core Web API (Fetch API / JWT Token).
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   Demo Credentials (Isolated for Testing & Presentation)
   ==========================================================================
   Admin:
     Email:    admin@smartcourier.com  (or 'admin')
     Password: Admin123

   Driver:
     Email:    driver@smartcourier.com (or 'driver')
     Password: Driver123
   ========================================================================== */
const DEMO_CREDENTIALS = [
  {
    identifiers: ['admin@smartcourier.com', 'admin'],
    password: 'Admin123',
    role: 'admin',
    name: 'Admin User',
    redirectUrl: 'admin/dashboard.html',
  },
  {
    identifiers: ['driver@smartcourier.com', 'driver'],
    password: 'Driver123',
    role: 'driver',
    name: 'Amit Patil',
    redirectUrl: 'driver/dashboard.html',
  },
];

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm         = document.getElementById('loginForm');
  const identifierInput   = document.getElementById('loginIdentifier');
  const passwordInput     = document.getElementById('loginPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const togglePasswordIcon= document.getElementById('togglePasswordIcon');
  const loginSubmitBtn    = document.getElementById('loginSubmitBtn');
  const loginBtnSpinner   = document.getElementById('loginBtnSpinner');
  const loginBtnText      = document.getElementById('loginBtnText');

  // Inline Validation Error Containers
  const identifierError   = document.getElementById('identifierError');
  const passwordError     = document.getElementById('passwordError');

  // Alert Banners Inside Login Card
  const loginAlertBox     = document.getElementById('loginAlertBox');
  const loginAlertMessage = document.getElementById('loginAlertMessage');
  const loginInfoBox      = document.getElementById('loginInfoBox');
  const loginInfoMessage  = document.getElementById('loginInfoMessage');

  // Forgot Password Link
  const forgotPasswordLink= document.getElementById('forgotPasswordLink');

  // Demo Autofill Chips
  const fillAdminChip     = document.getElementById('fillAdminChip');
  const fillDriverChip    = document.getElementById('fillDriverChip');

  if (!loginForm) return;

  /* ========================================================================
     1. Password Show / Hide Visibility Toggle
     ======================================================================== */
  if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      if (isPassword) {
        passwordInput.setAttribute('type', 'text');
        togglePasswordIcon.classList.replace('bi-eye', 'bi-eye-slash');
        togglePasswordBtn.setAttribute('aria-label', 'Hide password');
      } else {
        passwordInput.setAttribute('type', 'password');
        togglePasswordIcon.classList.replace('bi-eye-slash', 'bi-eye');
        togglePasswordBtn.setAttribute('aria-label', 'Show password');
      }
      passwordInput.focus();
    });
  }

  /* ========================================================================
     2. Forgot Password Notice (No alert() used)
     ======================================================================== */
  if (forgotPasswordLink && loginInfoBox) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      hideCardAlerts();
      if (loginInfoMessage) {
        loginInfoMessage.textContent =
          'Password recovery will be available after backend authentication is connected.';
      }
      loginInfoBox.classList.add('show');
    });
  }

  /* ========================================================================
     3. Demo Account Auto-Fill Helper Chips
     ======================================================================== */
  if (fillAdminChip) {
    fillAdminChip.addEventListener('click', () => {
      hideCardAlerts();
      resetFieldValidation(identifierInput, identifierError);
      resetFieldValidation(passwordInput, passwordError);
      identifierInput.value = 'admin@smartcourier.com';
      passwordInput.value = 'Admin123';
      passwordInput.focus();
    });
  }

  if (fillDriverChip) {
    fillDriverChip.addEventListener('click', () => {
      hideCardAlerts();
      resetFieldValidation(identifierInput, identifierError);
      resetFieldValidation(passwordInput, passwordError);
      identifierInput.value = 'driver@smartcourier.com';
      passwordInput.value = 'Driver123';
      passwordInput.focus();
    });
  }

  /* ========================================================================
     4. Form Validation & Error Handling
     ======================================================================== */
  function setFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('is-invalid');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('show');
    }
  }

  function resetFieldValidation(inputEl, errorEl) {
    inputEl.classList.remove('is-invalid');
    if (errorEl) {
      errorEl.classList.remove('show');
    }
  }

  function hideCardAlerts() {
    if (loginAlertBox) loginAlertBox.classList.remove('show');
    if (loginInfoBox) loginInfoBox.classList.remove('show');
  }

  function showCardError(message) {
    if (loginAlertBox && loginAlertMessage) {
      loginAlertMessage.textContent = message;
      loginAlertBox.classList.add('show');
    }
  }

  // Clear validation styling dynamically on input change
  identifierInput.addEventListener('input', () => {
    resetFieldValidation(identifierInput, identifierError);
    hideCardAlerts();
  });

  passwordInput.addEventListener('input', () => {
    resetFieldValidation(passwordInput, passwordError);
    hideCardAlerts();
  });

  /* ========================================================================
     5. Login Submission & Mock Authentication Flow
     ======================================================================== */
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideCardAlerts();

    const identifierVal = identifierInput.value.trim();
    const passwordVal   = passwordInput.value;

    let hasErrors = false;

    // Validate Identifier
    if (!identifierVal) {
      setFieldError(identifierInput, identifierError, 'Please enter your email or username.');
      hasErrors = true;
    } else {
      resetFieldValidation(identifierInput, identifierError);
    }

    // Validate Password
    if (!passwordVal) {
      setFieldError(passwordInput, passwordError, 'Please enter your password.');
      hasErrors = true;
    } else if (passwordVal.length < 6) {
      setFieldError(passwordInput, passwordError, 'Password must be at least 6 characters long.');
      hasErrors = true;
    } else {
      resetFieldValidation(passwordInput, passwordError);
    }

    if (hasErrors) {
      // Focus first erroneous field
      if (!identifierVal) {
        identifierInput.focus();
      } else {
        passwordInput.focus();
      }
      return;
    }

    // ------------------------------------------------------------------------
    // Loading State
    // ------------------------------------------------------------------------
    loginSubmitBtn.disabled = true;
    loginBtnSpinner.classList.remove('d-none');
    loginBtnText.textContent = 'Signing in…';

    // Simulate standard authentication delay (600ms)
    setTimeout(() => {
      // Check demo credentials
      const normalizedIdentifier = identifierVal.toLowerCase();

      const matchedUser = DEMO_CREDENTIALS.find((user) => {
        const identifierMatches = user.identifiers.some(
          (id) => id.toLowerCase() === normalizedIdentifier
        );
        // Case-sensitive check for the demo password (also allow lowercase for lenient testing)
        const passwordMatches =
          user.password === passwordVal || user.password.toLowerCase() === passwordVal.toLowerCase();
        return identifierMatches && passwordMatches;
      });

      if (!matchedUser) {
        // Reset loading state
        loginSubmitBtn.disabled = false;
        loginBtnSpinner.classList.add('d-none');
        loginBtnText.textContent = 'Login';

        // Display professional error banner inside login card
        showCardError(
          'Invalid email/username or password. Please verify your credentials and try again.'
        );
        passwordInput.focus();
        return;
      }

      // Store demo user in localStorage for session display on dashboards
      try {
        localStorage.setItem(
          'sc_user',
          JSON.stringify({
            name: matchedUser.name,
            email: matchedUser.identifiers[0],
            role: matchedUser.role,
          })
        );
        localStorage.setItem('sc_token', 'demo-session-token');
      } catch (err) {
        console.warn('Storage warning:', err);
      }

      // Success State -> Redirect to role dashboard
      loginBtnText.textContent = 'Success! Redirecting…';

      setTimeout(() => {
        window.location.href = matchedUser.redirectUrl;
      }, 300);
    }, 600);
  });
});
