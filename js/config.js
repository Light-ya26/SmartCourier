/**
 * SmartCourier – Centralized Configuration (config.js)
 * --------------------------------------------------------------------------
 * Single source of truth for:
 * 1. API base URL (ASP.NET Core Web API)
 * 2. Demo-mode toggle flag
 * 3. All REST endpoint path definitions
 * 4. localStorage key registry
 * 5. Application-wide constants
 * --------------------------------------------------------------------------
 * HOW TO SWITCH FROM DEMO TO LIVE API:
 *   1. Set USE_DEMO_DATA = false
 *   2. Update API_BASE_URL to your deployed ASP.NET Core backend
 *   3. Ensure CORS is configured on the server
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   1. API Base URL
   ========================================================================== */

/**
 * Base URL of the ASP.NET Core Web API.
 * Update this value when deploying to staging or production.
 *
 * Examples:
 *   Development : "https://localhost:5001/api"
 *   Staging     : "https://staging-api.smartcourier.com/api"
 *   Production  : "https://api.smartcourier.com/api"
 */
const API_BASE_URL = "https://localhost:5001/api";

/* ==========================================================================
   2. Demo-Mode Toggle
   ========================================================================== */

/**
 * When true, all data operations use localStorage instead of the Web API.
 * Set to false to enable real HTTP calls via js/api.js.
 */
const USE_DEMO_DATA = true;

/* ==========================================================================
   3. REST Endpoint Definitions
   ========================================================================== */

/**
 * Centralized endpoint map.
 * Each module's js file currently defines its own local endpoints —
 * this registry acts as the canonical reference for js/api.js.
 *
 * All paths are relative to API_BASE_URL.
 */
const API_ENDPOINTS = Object.freeze({

  /* ----- Authentication ----- */
  AUTH_LOGIN:           "/auth/login",
  AUTH_LOGOUT:          "/auth/logout",
  AUTH_REFRESH:         "/auth/refresh",

  /* ----- Deliveries ----- */
  DELIVERIES:           "/deliveries",          // GET (list), POST (create)
  DELIVERY:             (id) => `/deliveries/${id}`,  // GET, PUT, DELETE
  DELIVERY_STATUS:      (id) => `/deliveries/${id}/status`,  // PATCH

  /* ----- Drivers ----- */
  DRIVERS:              "/drivers",             // GET (list), POST (create)
  DRIVER:               (id) => `/drivers/${id}`,     // GET, PUT, DELETE
  DRIVER_STATUS:        (id) => `/drivers/${id}/status`,     // PATCH
  DRIVER_DELIVERIES:    (id) => `/drivers/${id}/deliveries`, // GET

  /* ----- Routes ----- */
  ROUTES:               "/routes",              // GET (list), POST (create)
  ROUTE:                (id) => `/routes/${id}`,      // GET, PUT, DELETE
  ROUTE_OPTIMIZE:       "/routes/optimize",     // POST
  ROUTE_ASSIGN:         (routeId) => `/routes/${routeId}/assign`, // POST

  /* ----- Dashboard ----- */
  DASHBOARD_STATS:      "/dashboard/statistics", // GET
  DASHBOARD_RECENT:     "/dashboard/recent",     // GET
});

/* ==========================================================================
   4. localStorage Key Registry
   ========================================================================== */

/**
 * All localStorage keys used across the SmartCourier application.
 * Centralizing them here prevents key collisions and makes it easy
 * to clear application state in one place.
 */
const STORAGE_KEYS = Object.freeze({
  DELIVERIES:      "sc_deliveries",
  DRIVERS:         "sc_drivers",
  ROUTES_HISTORY:  "sc_routes_history",
  USER:            "sc_user",
  TOKEN:           "sc_token",
});

/* ==========================================================================
   5. Application Constants
   ========================================================================== */

/**
 * Default request timeout for API calls (in milliseconds).
 */
const API_TIMEOUT_MS = 15000;

/**
 * Default pagination page size.
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Delivery status workflow order — used for timeline steppers and
 * transition validation.
 */
const DELIVERY_STATUS_ORDER = Object.freeze([
  "Pending",
  "Assigned",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
]);

/**
 * Priority levels used across delivery and route modules.
 */
const PRIORITY_LEVELS = Object.freeze(["Low", "Normal", "High", "Urgent"]);

/**
 * Driver status options.
 */
const DRIVER_STATUSES = Object.freeze(["Available", "On Delivery", "Offline"]);

/* ==========================================================================
   6. Utility: Build Full URL
   ========================================================================== */

/**
 * Constructs a fully-qualified API URL from a relative endpoint path.
 *
 * @param {string} endpointPath – relative path (e.g., "/deliveries")
 * @returns {string} Full URL (e.g., "https://localhost:5001/api/deliveries")
 */
function buildApiUrl(endpointPath) {
  return `${API_BASE_URL}${endpointPath}`;
}
