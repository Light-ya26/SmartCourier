/**
 * SmartCourier – API Service Layer (api.js)
 * --------------------------------------------------------------------------
 * Provides reusable async functions for every SmartCourier REST operation.
 *
 * BEHAVIOUR:
 *   • When USE_DEMO_DATA === true  → functions delegate to localStorage
 *     helpers, preserving full offline demo functionality.
 *   • When USE_DEMO_DATA === false → functions perform real fetch() calls
 *     to the ASP.NET Core Web API at API_BASE_URL.
 *
 * DEPENDENCIES (loaded before this file via <script> tags):
 *   • js/config.js   — API_BASE_URL, USE_DEMO_DATA, API_ENDPOINTS,
 *                       STORAGE_KEYS, API_TIMEOUT_MS, buildApiUrl()
 *
 * USAGE:
 *   const deliveries = await SmartCourierAPI.deliveries.getAll();
 *   const driver     = await SmartCourierAPI.drivers.getById("DR-001");
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   1. HTTP Helper — Wraps fetch() with timeout, auth headers & error handling
   ========================================================================== */

/**
 * Generic HTTP request wrapper.
 *
 * @param {string}  url           – Fully-qualified API URL
 * @param {Object}  [options={}]  – Standard fetch() options override
 * @returns {Promise<Object|null>} Parsed JSON body or null on 204
 * @throws {Error} On network failure, timeout, or non-2xx response
 */
async function apiRequest(url, options = {}) {
  /* -- Build default headers ------------------------------------------- */
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  /* -- Attach JWT token if present ------------------------------------- */
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  /* -- Create AbortController for timeout ------------------------------ */
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    /* -- Handle 204 No Content ----------------------------------------- */
    if (response.status === 204) return null;

    /* -- Handle non-2xx responses -------------------------------------- */
    if (!response.ok) {
      let errorBody = {};
      try { errorBody = await response.json(); } catch (_) { /* empty */ }

      const error = new Error(
        errorBody.message || errorBody.title || `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    return await response.json();

  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}


/* ==========================================================================
   2. localStorage Demo Helpers
   ========================================================================== */

/**
 * Reads a JSON array from localStorage by key, or returns fallback.
 *
 * @param {string} storageKey
 * @param {Array}  fallback
 * @returns {Array}
 */
function demoGetList(storageKey, fallback = []) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

/**
 * Writes a JSON array to localStorage.
 *
 * @param {string} storageKey
 * @param {Array}  list
 */
function demoSaveList(storageKey, list) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}


/* ==========================================================================
   3. Delivery Service
   ========================================================================== */

const DeliveryService = {

  /**
   * Retrieve all deliveries.
   * @returns {Promise<Array>}
   */
  async getAll() {
    if (USE_DEMO_DATA) {
      return demoGetList(STORAGE_KEYS.DELIVERIES);
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DELIVERIES));
  },

  /**
   * Retrieve a single delivery by ID.
   * @param {string} id – e.g., "SC-1001"
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DELIVERIES);
      return list.find((d) => d.id === id) || null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DELIVERY(id)));
  },

  /**
   * Create a new delivery.
   * @param {Object} data – delivery payload
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DELIVERIES);
      list.push(data);
      demoSaveList(STORAGE_KEYS.DELIVERIES, list);
      return data;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DELIVERIES), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing delivery.
   * @param {string} id   – delivery ID
   * @param {Object} data – updated delivery payload
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DELIVERIES);
      const idx = list.findIndex((d) => d.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        demoSaveList(STORAGE_KEYS.DELIVERIES, list);
        return list[idx];
      }
      return null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DELIVERY(id)), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a delivery.
   * @param {string} id – delivery ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (USE_DEMO_DATA) {
      let list = demoGetList(STORAGE_KEYS.DELIVERIES);
      list = list.filter((d) => d.id !== id);
      demoSaveList(STORAGE_KEYS.DELIVERIES, list);
      return true;
    }
    await apiRequest(buildApiUrl(API_ENDPOINTS.DELIVERY(id)), {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * Update only the status of a delivery (partial update).
   * @param {string} id     – delivery ID
   * @param {string} status – new status value
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DELIVERIES);
      const idx = list.findIndex((d) => d.id === id);
      if (idx !== -1) {
        list[idx].status = status;
        demoSaveList(STORAGE_KEYS.DELIVERIES, list);
        return list[idx];
      }
      return null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DELIVERY_STATUS(id)), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};


/* ==========================================================================
   4. Driver Service
   ========================================================================== */

const DriverService = {

  /**
   * Retrieve all drivers.
   * @returns {Promise<Array>}
   */
  async getAll() {
    if (USE_DEMO_DATA) {
      return demoGetList(STORAGE_KEYS.DRIVERS);
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DRIVERS));
  },

  /**
   * Retrieve a single driver by ID.
   * @param {string} id – e.g., "DR-001"
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DRIVERS);
      return list.find((d) => d.id === id) || null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DRIVER(id)));
  },

  /**
   * Create a new driver.
   * @param {Object} data – driver payload
   * @returns {Promise<Object>}
   */
  async create(data) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DRIVERS);
      list.push(data);
      demoSaveList(STORAGE_KEYS.DRIVERS, list);
      return data;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DRIVERS), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing driver.
   * @param {string} id   – driver ID
   * @param {Object} data – updated driver payload
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DRIVERS);
      const idx = list.findIndex((d) => d.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        demoSaveList(STORAGE_KEYS.DRIVERS, list);
        return list[idx];
      }
      return null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DRIVER(id)), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a driver.
   * @param {string} id – driver ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (USE_DEMO_DATA) {
      let list = demoGetList(STORAGE_KEYS.DRIVERS);
      list = list.filter((d) => d.id !== id);
      demoSaveList(STORAGE_KEYS.DRIVERS, list);
      return true;
    }
    await apiRequest(buildApiUrl(API_ENDPOINTS.DRIVER(id)), {
      method: 'DELETE',
    });
    return true;
  },

  /**
   * Update only the status of a driver (partial update).
   * @param {string} id     – driver ID
   * @param {string} status – new status value
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.DRIVERS);
      const idx = list.findIndex((d) => d.id === id);
      if (idx !== -1) {
        list[idx].status = status;
        demoSaveList(STORAGE_KEYS.DRIVERS, list);
        return list[idx];
      }
      return null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DRIVER_STATUS(id)), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Retrieve deliveries assigned to a specific driver.
   * @param {string} driverId
   * @returns {Promise<Array>}
   */
  async getDeliveries(driverId) {
    if (USE_DEMO_DATA) {
      const deliveries = demoGetList(STORAGE_KEYS.DELIVERIES);
      const driver = (demoGetList(STORAGE_KEYS.DRIVERS)).find((d) => d.id === driverId);
      if (!driver) return [];
      return deliveries.filter((d) => d.driver === driver.name);
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DRIVER_DELIVERIES(driverId)));
  },
};


/* ==========================================================================
   5. Route Service
   ========================================================================== */

const RouteService = {

  /**
   * Retrieve all saved routes.
   * @returns {Promise<Array>}
   */
  async getAll() {
    if (USE_DEMO_DATA) {
      return demoGetList(STORAGE_KEYS.ROUTES_HISTORY);
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.ROUTES));
  },

  /**
   * Retrieve a single route by ID.
   * @param {string} id – e.g., "RT-001"
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.ROUTES_HISTORY);
      return list.find((r) => r.id === id) || null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.ROUTE(id)));
  },

  /**
   * Send stops to the optimizer and receive an optimized route.
   * @param {Object} data – { stops: [...], algorithm: "tsp" }
   * @returns {Promise<Object>} Optimized route with metrics
   */
  async optimize(data) {
    if (USE_DEMO_DATA) {
      // Demo mode: the optimization logic lives in routes.js
      // This service simply returns the input unchanged; routes.js handles TSP locally.
      return data;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.ROUTE_OPTIMIZE), {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Assign an optimized route to a driver.
   * @param {string} routeId  – route identifier
   * @param {string} driverId – driver to assign
   * @returns {Promise<Object>}
   */
  async assign(routeId, driverId) {
    if (USE_DEMO_DATA) {
      const list = demoGetList(STORAGE_KEYS.ROUTES_HISTORY);
      const idx = list.findIndex((r) => r.id === routeId);
      if (idx !== -1) {
        list[idx].assignedDriver = driverId;
        list[idx].status = "Assigned";
        demoSaveList(STORAGE_KEYS.ROUTES_HISTORY, list);
        return list[idx];
      }
      return null;
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.ROUTE_ASSIGN(routeId)), {
      method: 'POST',
      body: JSON.stringify({ driverId }),
    });
  },
};


/* ==========================================================================
   6. Authentication Service
   ========================================================================== */

const AuthService = {

  /**
   * Authenticate a user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} { token, user: { name, role, email } }
   */
  async login(email, password) {
    if (USE_DEMO_DATA) {
      // Demo auth is handled entirely by auth.js — this stub exists so that
      // future migration only requires flipping USE_DEMO_DATA.
      throw new Error('Demo authentication is handled by auth.js directly.');
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.AUTH_LOGIN), {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * End the current session.
   * @returns {Promise<void>}
   */
  async logout() {
    if (USE_DEMO_DATA) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      return;
    }
    await apiRequest(buildApiUrl(API_ENDPOINTS.AUTH_LOGOUT), {
      method: 'POST',
    });
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },

  /**
   * Refresh the JWT token.
   * @returns {Promise<Object>} { token }
   */
  async refreshToken() {
    if (USE_DEMO_DATA) return { token: 'demo-session-token' };
    return apiRequest(buildApiUrl(API_ENDPOINTS.AUTH_REFRESH), {
      method: 'POST',
    });
  },
};


/* ==========================================================================
   7. Dashboard Service
   ========================================================================== */

const DashboardService = {

  /**
   * Get dashboard summary statistics.
   * @returns {Promise<Object>} { totalDeliveries, pending, inTransit, delivered }
   */
  async getStatistics() {
    if (USE_DEMO_DATA) {
      const deliveries = demoGetList(STORAGE_KEYS.DELIVERIES);
      return {
        totalDeliveries: deliveries.length,
        pending:   deliveries.filter((d) => d.status === 'Pending').length,
        inTransit: deliveries.filter((d) => d.status === 'In Transit').length,
        delivered: deliveries.filter((d) => d.status === 'Delivered').length,
      };
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DASHBOARD_STATS));
  },

  /**
   * Get recent delivery activity for the dashboard.
   * @param {number} [limit=5] – Number of recent deliveries to return
   * @returns {Promise<Array>}
   */
  async getRecentDeliveries(limit = 5) {
    if (USE_DEMO_DATA) {
      const deliveries = demoGetList(STORAGE_KEYS.DELIVERIES);
      return deliveries.slice(0, limit);
    }
    return apiRequest(buildApiUrl(API_ENDPOINTS.DASHBOARD_RECENT) + `?limit=${limit}`);
  },
};


/* ==========================================================================
   8. Public Façade — SmartCourierAPI Namespace
   ========================================================================== */

/**
 * Unified entry-point for all API operations.
 *
 * Usage:
 *   const all = await SmartCourierAPI.deliveries.getAll();
 *   const d   = await SmartCourierAPI.deliveries.getById("SC-1001");
 *   await SmartCourierAPI.drivers.create({ id: "DR-010", name: "…" });
 */
const SmartCourierAPI = Object.freeze({
  deliveries: DeliveryService,
  drivers:    DriverService,
  routes:     RouteService,
  auth:       AuthService,
  dashboard:  DashboardService,
});

/* ==========================================================================
   9. Direct Global Function Exports (Convenience functions per specification)
   ========================================================================== */

/* ----- Deliveries ----- */
async function getDeliveries() { return DeliveryService.getAll(); }
async function getDelivery(id) { return DeliveryService.getById(id); }
async function createDelivery(data) { return DeliveryService.create(data); }
async function updateDelivery(id, data) { return DeliveryService.update(id, data); }
async function deleteDelivery(id) { return DeliveryService.delete(id); }
async function updateDeliveryStatus(id, status) { return DeliveryService.updateStatus(id, status); }

/* ----- Drivers ----- */
async function getDrivers() { return DriverService.getAll(); }
async function getDriver(id) { return DriverService.getById(id); }
async function createDriver(data) { return DriverService.create(data); }
async function updateDriver(id, data) { return DriverService.update(id, data); }
async function deleteDriver(id) { return DriverService.delete(id); }

/* ----- Routes ----- */
async function getRoutes() { return RouteService.getAll(); }
async function getRoute(id) { return RouteService.getById(id); }
async function optimizeRoute(data) { return RouteService.optimize(data); }
async function assignRoute(routeId, driverId) { return RouteService.assign(routeId, driverId); }

