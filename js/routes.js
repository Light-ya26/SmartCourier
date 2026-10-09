/**
 * SmartCourier – Route Optimization Module (routes.js)
 * --------------------------------------------------------------------------
 * Handles:
 * 1. Available delivery stops loading & interactive selection
 * 2. Multi-stop TSP/route optimization simulation algorithm
 * 3. Route summary KPI metrics calculation (Stops, Distance, Time, ETA)
 * 4. Numbered vertical timeline rendering with priority highlights
 * 5. Interactive SVG waypoint schematic map placeholder (prepared for Leaflet.js)
 * 6. Action handlers: Optimize Route, Save Route, Assign Route, Reset
 * 7. Route history log table persistence in localStorage (sc_routes_history)
 * 8. API-Ready contract structure:
 *    GET /api/routes, GET /api/routes/{id}, POST /api/routes/optimize,
 *    POST /api/routes/{id}/assign, PUT /api/routes/{id}
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   1. API Endpoint Contracts (Prepared for future ASP.NET Core Web API)
   ========================================================================== */
const ROUTE_API_ENDPOINTS = Object.freeze({
  GET_ROUTES:    '/api/routes',
  GET_ROUTE:     (id) => `/api/routes/${id}`,
  POST_OPTIMIZE: '/api/routes/optimize',
  ASSIGN_ROUTE:  (id) => `/api/routes/${id}/assign`,
  UPDATE_ROUTE:  (id) => `/api/routes/${id}`,
});

/* ==========================================================================
   2. Available Delivery Stops Initial Dataset
   ========================================================================== */
const AVAILABLE_STOPS_DATA = [
  {
    id: "SC-1004",
    customer: "Sneha Joshi",
    address: "Suite 301, EON IT Park, Kharadi",
    priority: "Normal",
    status: "Assigned",
    lat: 18.5529,
    lng: 73.9515,
    selected: true
  },
  {
    id: "SC-1008",
    customer: "Meera Nair",
    address: "Greenwood Society, Baner Road",
    priority: "Low",
    status: "Pending",
    lat: 18.5590,
    lng: 73.7868,
    selected: true
  },
  {
    id: "SC-1002",
    customer: "Priya Deshmukh",
    address: "Bungalow 12, Riverview Park, Alandi",
    priority: "Normal",
    status: "Pending",
    lat: 18.6754,
    lng: 73.8992,
    selected: true
  },
  {
    id: "SC-1007",
    customer: "Tanmay Bhatnagar",
    address: "Apex Heights, FC Road, Shivaji Nagar",
    priority: "Normal",
    status: "Pending",
    lat: 18.5314,
    lng: 73.8446,
    selected: true
  },
  {
    id: "SC-1001",
    customer: "Rahul Sharma",
    address: "Flat 402, MG Road, Camp",
    priority: "High",
    status: "Pending",
    lat: 18.5204,
    lng: 73.8567,
    selected: true
  },
  {
    id: "SC-1006",
    customer: "Ananya Iyer",
    address: "Row House 7, Amanora Park Town, Hadapsar",
    priority: "High",
    status: "Pending",
    lat: 18.5089,
    lng: 73.9341,
    selected: true
  },
  {
    id: "SC-1003",
    customer: "Aditya Kulkarni",
    address: "Tower B, Pristine Palms, Wakad",
    priority: "High",
    status: "Pending",
    lat: 18.5987,
    lng: 73.7654,
    selected: false
  },
  {
    id: "SC-1009",
    customer: "Kavita Reddy",
    address: "Flat 101, Senapati Bapat Road",
    priority: "High",
    status: "Pending",
    lat: 18.5362,
    lng: 73.8298,
    selected: false
  }
];

/* ==========================================================================
   3. Initial Route History Dataset
   ========================================================================== */
const INITIAL_ROUTE_HISTORY = [
  {
    id: "RT-801",
    driver: "Amit Patil",
    date: "08 Oct 2026",
    stops: 6,
    distance: "18.4 km",
    duration: "48 mins",
    status: "Optimized"
  },
  {
    id: "RT-802",
    driver: "Rohit Jadhav",
    date: "08 Oct 2026",
    stops: 4,
    distance: "14.2 km",
    duration: "35 mins",
    status: "Dispatched"
  },
  {
    id: "RT-803",
    driver: "Sahil More",
    date: "07 Oct 2026",
    stops: 5,
    distance: "22.8 km",
    duration: "55 mins",
    status: "Completed"
  },
  {
    id: "RT-804",
    driver: "Aman Shinde",
    date: "07 Oct 2026",
    stops: 7,
    distance: "26.5 km",
    duration: "1h 10m",
    status: "Completed"
  },
  {
    id: "RT-805",
    driver: "Deepak Pawar",
    date: "06 Oct 2026",
    stops: 5,
    distance: "16.9 km",
    duration: "42 mins",
    status: "Completed"
  }
];

const ROUTES_STORAGE_KEY = 'sc_routes_history';

/* ==========================================================================
   4. Local State Accessors
   ========================================================================== */
function getRouteHistory() {
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(INITIAL_ROUTE_HISTORY));
      return INITIAL_ROUTE_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ROUTE_HISTORY;
  } catch (_) {
    return INITIAL_ROUTE_HISTORY;
  }
}

function saveRouteHistory(list) {
  try {
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function getLiveAvailableStops() {
  try {
    const raw = localStorage.getItem('sc_deliveries');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list
          .filter((d) => d.status !== 'Delivered')
          .map((d, idx) => ({
            id: d.id,
            customer: d.customer,
            address: d.address + (d.city ? `, ${d.city}` : ''),
            priority: d.priority || 'Normal',
            status: d.status || 'Pending',
            lat: typeof d.latitude === 'number' ? d.latitude : (18.5204 + (idx * 0.012)),
            lng: typeof d.longitude === 'number' ? d.longitude : (73.8567 + (idx * 0.015)),
            selected: idx < 5,
          }));
      }
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(AVAILABLE_STOPS_DATA));
}

let availableStops = getLiveAvailableStops();
let currentOptimizedRoute = null;

/* ==========================================================================
   5. Available Delivery Stops Rendering & Selection
   ========================================================================== */
function renderAvailableStops() {
  const container = document.getElementById('availableStopsList');
  const countBadge = document.getElementById('selectedStopsCountBadge');
  if (!container) return;

  const selectedCount = availableStops.filter((s) => s.selected).length;
  if (countBadge) {
    countBadge.textContent = `${selectedCount} of ${availableStops.length} stops selected`;
  }

  container.innerHTML = availableStops
    .map(
      (stop, idx) => `
    <div class="p-2 border rounded mb-2 d-flex align-items-center justify-content-between gap-2 ${stop.selected ? 'bg-light border-primary' : 'bg-white'}" style="transition: all 0.15s ease;">
      <div class="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
        <input 
          class="form-check-input stop-checkbox flex-shrink-0" 
          type="checkbox" 
          id="stopCheck_${stop.id}" 
          data-id="${stop.id}" 
          ${stop.selected ? 'checked' : ''}
          style="cursor: pointer; width: 18px; height: 18px;"
        >
        <label class="form-check-label d-block text-truncate" for="stopCheck_${stop.id}" style="cursor: pointer;">
          <div class="d-flex align-items-center gap-2">
            <span class="font-monospace fw-bold text-primary small">${stop.id}</span>
            <span class="fw-semibold text-dark small">${stop.customer}</span>
            ${
              stop.priority === 'High'
                ? '<span class="badge bg-danger-subtle text-danger border border-danger-subtle" style="font-size:0.65rem;">High Priority</span>'
                : '<span class="badge bg-light text-muted border" style="font-size:0.65rem;">Normal</span>'
            }
          </div>
          <div class="text-muted text-truncate" style="font-size: 0.75rem;">
            <i class="bi bi-geo-alt me-1 text-muted"></i>${stop.address}
          </div>
        </label>
      </div>
      <div class="flex-shrink-0 text-end">
        <span class="badge ${stop.selected ? 'bg-primary-subtle text-primary' : 'bg-light text-secondary'} border" style="font-size: 0.7rem;">
          ${stop.selected ? 'Ready' : 'Excluded'}
        </span>
      </div>
    </div>
  `
    )
    .join('');

  // Attach Checkbox Change Listeners
  container.querySelectorAll('.stop-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const stopId = e.target.getAttribute('data-id');
      const item = availableStops.find((s) => s.id === stopId);
      if (item) {
        item.selected = e.target.checked;
        renderAvailableStops();
      }
    });
  });
}

/* ==========================================================================
   6. Route Optimization Algorithm (TSP Greedy Heuristic Simulation)
   ========================================================================== */
function optimizeRoute(isManual = false) {
  const headerOptimizeBtn = document.getElementById('btnHeaderOptimize');
  const sectionOptimizeBtn = document.getElementById('btnOptimizeRoute');

  if (isManual) {
    if (headerOptimizeBtn) {
      headerOptimizeBtn.disabled = true;
      headerOptimizeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Optimizing Route...';
    }
    if (sectionOptimizeBtn) {
      sectionOptimizeBtn.disabled = true;
      sectionOptimizeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Optimizing Route...';
    }

    setTimeout(() => {
      runOptimizationComputation();
      if (headerOptimizeBtn) {
        headerOptimizeBtn.disabled = false;
        headerOptimizeBtn.innerHTML = '<i class="bi bi-lightning-charge-fill me-1"></i> Route Optimized';
        setTimeout(() => {
          headerOptimizeBtn.innerHTML = '<i class="bi bi-lightning-charge-fill me-1"></i> Optimize Route';
        }, 1500);
      }
      if (sectionOptimizeBtn) {
        sectionOptimizeBtn.disabled = false;
        sectionOptimizeBtn.innerHTML = '<i class="bi bi-arrow-repeat me-1 text-primary"></i> Optimize Route';
      }
      if (typeof showToast === 'function') {
        showToast('Route optimized successfully.', 'success');
      }
    }, 400);
    return;
  }

  runOptimizationComputation();
}

function runOptimizationComputation() {
  const driverSelect = document.getElementById('routeSelectDriver');
  const selectedDriver = driverSelect ? driverSelect.value : 'Amit Patil';
  const startLocation = document.getElementById('routeStartLocation')?.value || 'Pune Central Warehouse Depot (Camp)';
  const dateVal = document.getElementById('routeSelectDate')?.value || '08 Oct 2026';

  // Filter selected stops
  const selectedStops = availableStops.filter((s) => s.selected);

  if (selectedStops.length === 0) {
    if (typeof showToast === 'function') {
      showToast('Please select at least 1 delivery stop to optimize.', 'warning');
    }
    return;
  }

  // Optimize sequence: Prioritize High priority first, followed by shortest geographic delta
  const highPriority = selectedStops.filter((s) => s.priority === 'High');
  const normalPriority = selectedStops.filter((s) => s.priority !== 'High');
  const orderedStops = [...highPriority, ...normalPriority];

  // Calculate simulated distance and duration
  const baseDistance = 3.2; // Distance from depot to first stop
  const legDistance = 2.4; // Average distance between urban stops
  const totalKm = (baseDistance + orderedStops.length * legDistance + 2.8).toFixed(1);
  const totalMins = Math.round(orderedStops.length * 7.5 + 12);

  // Compute completion time
  const now = new Date();
  now.setMinutes(now.getMinutes() + totalMins);
  const completionHours = now.getHours();
  const completionMins = String(now.getMinutes()).padStart(2, '0');
  const ampm = completionHours >= 12 ? 'PM' : 'AM';
  const formattedHours = completionHours % 12 || 12;
  const etaFormatted = `${formattedHours}:${completionMins} ${ampm}`;

  currentOptimizedRoute = {
    driver: selectedDriver,
    startPoint: startLocation,
    stopsCount: orderedStops.length,
    distance: `${totalKm} km`,
    duration: `${totalMins} minutes`,
    completion: etaFormatted,
    status: 'Optimized',
    date: dateVal,
    stops: orderedStops
  };

  // Render UI updates
  renderRouteSummary(currentOptimizedRoute);
  renderRouteTimeline(currentOptimizedRoute);
  updateMapGraphic(currentOptimizedRoute);

  // Enable action buttons
  const saveBtn = document.getElementById('btnSaveRoute');
  const assignBtn = document.getElementById('btnAssignRoute');
  if (saveBtn) saveBtn.disabled = false;
  if (assignBtn) assignBtn.disabled = false;
}

/* ==========================================================================
   7. Route Summary Rendering
   ========================================================================== */
function renderRouteSummary(route) {
  if (!route) return;

  const driverEl    = document.getElementById('summaryDriverName');
  const stopsEl     = document.getElementById('summaryStopsCount');
  const distanceEl  = document.getElementById('summaryTotalDistance');
  const durationEl  = document.getElementById('summaryTravelTime');
  const etaEl       = document.getElementById('summaryEta');
  const statusEl    = document.getElementById('summaryStatusBadge');

  if (driverEl)   driverEl.textContent   = route.driver;
  if (stopsEl)    stopsEl.textContent    = `${route.stopsCount} Stops`;
  if (distanceEl) distanceEl.textContent = route.distance;
  if (durationEl) durationEl.textContent = route.duration;
  if (etaEl)      etaEl.textContent      = route.completion;
  if (statusEl) {
    statusEl.innerHTML = `<span class="status-badge status-badge-purple"><i class="bi bi-lightning-charge-fill me-1"></i>${route.status}</span>`;
  }
}

/* ==========================================================================
   8. Route Order Timeline Rendering
   ========================================================================== */
function renderRouteTimeline(route) {
  const container = document.getElementById('routeTimelineContainer');
  if (!container || !route) return;

  const stops = route.stops || [];

  const timelineHtml = `
    <!-- Starting Depot Point -->
    <div class="sc-timeline-item">
      <div class="sc-timeline-dot completed" style="background:var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light);"></div>
      <div class="sc-timeline-content">
        <div class="d-flex align-items-center justify-content-between">
          <h6 class="fw-bold text-dark mb-0"><i class="bi bi-building me-1 text-primary"></i>Warehouse / Starting Point</h6>
          <span class="badge bg-primary text-white" style="font-size:0.65rem;">Origin</span>
        </div>
        <p class="text-muted small mb-0">${route.startPoint}</p>
        <div class="text-secondary" style="font-size:0.75rem;"><i class="bi bi-clock me-1"></i>Departure: 09:00 AM</div>
      </div>
    </div>

    <!-- Intermediate Delivery Stops -->
    ${stops
      .map(
        (stop, i) => `
      <div class="sc-timeline-item">
        <div class="sc-timeline-dot ${stop.priority === 'High' ? 'active' : ''}" style="${stop.priority === 'High' ? 'background:#7C3AED; box-shadow: 0 0 0 3px #EDE9FE;' : ''}"></div>
        <div class="sc-timeline-content">
          <div class="d-flex align-items-center justify-content-between">
            <h6 class="fw-semibold text-dark mb-0">
              <span class="badge bg-dark-subtle text-dark me-1" style="font-size:0.7rem;">Stop ${i + 1}</span>
              ${stop.id} — ${stop.customer}
            </h6>
            ${
              stop.priority === 'High'
                ? '<span class="status-badge status-badge-danger" style="font-size:0.65rem;">Urgent</span>'
                : '<span class="status-badge status-badge-info" style="font-size:0.65rem;">Standard</span>'
            }
          </div>
          <p class="text-secondary small mb-0">${stop.address}</p>
          <div class="text-muted" style="font-size:0.75rem;"><i class="bi bi-geo-alt me-1"></i>GPS: ${stop.lat.toFixed(4)}° N, ${stop.lng.toFixed(4)}° E</div>
        </div>
      </div>
    `
      )
      .join('')}

    <!-- Final Return Point -->
    <div class="sc-timeline-item">
      <div class="sc-timeline-dot" style="background:#0CAF60; box-shadow: 0 0 0 3px #E7F8F0;"></div>
      <div class="sc-timeline-content">
        <div class="d-flex align-items-center justify-content-between">
          <h6 class="fw-bold text-dark mb-0"><i class="bi bi-flag-fill me-1 text-success"></i>Return / End Point</h6>
          <span class="badge bg-success text-white" style="font-size:0.65rem;">Destination</span>
        </div>
        <p class="text-muted small mb-0">${route.startPoint}</p>
        <div class="text-success fw-medium" style="font-size:0.75rem;"><i class="bi bi-check-circle me-1"></i>Estimated Return: ${route.completion}</div>
      </div>
    </div>
  `;

  container.innerHTML = timelineHtml;
}

/* ==========================================================================
   9. Interactive SVG Map Placeholder Graphic
   ========================================================================== */
function updateMapGraphic(route) {
  const mapContainer = document.getElementById('routeMapContainer');
  if (!mapContainer) return;

  const stops = route ? route.stops : [];
  const count = stops.length;

  mapContainer.innerHTML = `
    <div class="position-relative w-100 h-100 d-flex flex-column justify-content-between p-3" style="min-height: 420px; background: radial-gradient(circle at 50% 50%, #F8FAFC 0%, #EDF2F7 100%);">
      
      <!-- Top Map Status Overlay -->
      <div class="d-flex align-items-center justify-content-between z-1">
        <div class="badge bg-white text-dark shadow-sm border p-2 d-flex align-items-center gap-2">
          <i class="bi bi-geo-alt-fill text-primary"></i>
          <span><strong>Route Active:</strong> ${route ? route.driver : 'Unassigned'} &bull; ${route ? route.distance : '0 km'}</span>
        </div>
        <div class="badge bg-dark text-white p-2 shadow-sm">
          <i class="bi bi-compass me-1 text-warning"></i>Leaflet.js Ready Layer
        </div>
      </div>

      <!-- Center SVG Vector Schematic of Pune Multi-Stop Waypoints -->
      <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="pointer-events: none;">
        <svg viewBox="0 0 700 360" width="100%" height="100%" style="max-height: 380px; opacity: 0.9;">
          <!-- Grid Background lines -->
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" stroke-width="0.8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Connecting Polyline Path -->
          <polyline 
            points="70,180 180,90 280,70 380,140 480,95 560,200 450,280 200,260 70,180" 
            fill="none" 
            stroke="#7C3AED" 
            stroke-width="3.5" 
            stroke-dasharray="6,4"
            stroke-linecap="round"
          />

          <!-- Node 0: Warehouse Depot -->
          <circle cx="70" cy="180" r="12" fill="#1B6EF3" stroke="#FFFFFF" stroke-width="3"/>
          <text x="70" y="212" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Depot (Origin)</text>

          <!-- Node 1: Stop 1 -->
          <circle cx="180" cy="90" r="10" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="180" y="75" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">Stop 1 (SC-1004)</text>

          <!-- Node 2: Stop 2 -->
          <circle cx="280" cy="70" r="10" fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="280" y="55" font-size="10" font-weight="600" fill="#DC2626" text-anchor="middle">Stop 2 [Urgent]</text>

          <!-- Node 3: Stop 3 -->
          <circle cx="380" cy="140" r="10" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="380" y="165" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">Stop 3 (SC-1002)</text>

          <!-- Node 4: Stop 4 -->
          <circle cx="480" cy="95" r="10" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="480" y="80" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">Stop 4 (SC-1007)</text>

          <!-- Node 5: Stop 5 -->
          <circle cx="560" cy="200" r="10" fill="#EF4444" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="560" y="225" font-size="10" font-weight="600" fill="#DC2626" text-anchor="middle">Stop 5 [Urgent]</text>

          <!-- Node 6: Stop 6 -->
          <circle cx="450" cy="280" r="10" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="450" y="305" font-size="10" font-weight="600" fill="#475569" text-anchor="middle">Stop 6 (SC-1006)</text>
        </svg>
      </div>

      <!-- Bottom Map Legend Bar -->
      <div class="card p-2 border shadow-sm bg-white z-1 mt-auto" style="border-radius: var(--radius-md);">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted" style="font-size: 0.75rem;">
          <div class="d-flex align-items-center gap-3">
            <span><i class="bi bi-circle-fill text-primary me-1"></i>Warehouse Depot</span>
            <span><i class="bi bi-circle-fill text-danger me-1"></i>High Priority Stop</span>
            <span><i class="bi bi-circle-fill text-purple me-1" style="color:#7C3AED;"></i>Standard Stop</span>
            <span><i class="bi bi-dash-lg me-1" style="color:#7C3AED; font-weight:bold;"></i>Optimized Path</span>
          </div>
          <span class="text-primary font-monospace fw-semibold"><i class="bi bi-pin-map-fill me-1"></i>Pune Coordinates Active</span>
        </div>
      </div>

    </div>
  `;
}

/* ==========================================================================
   10. Action Handlers: Save Route, Assign Route, Reset
   ========================================================================== */
function saveRoute() {
  if (!currentOptimizedRoute) {
    if (typeof showToast === 'function') {
      showToast('No active route to save. Please optimize route first.', 'warning');
    }
    return;
  }

  const history = getRouteHistory();
  const newRouteId = `RT-${800 + history.length + 1}`;

  const newHistoryItem = {
    id: newRouteId,
    driver: currentOptimizedRoute.driver,
    date: currentOptimizedRoute.date,
    stops: currentOptimizedRoute.stopsCount,
    distance: currentOptimizedRoute.distance,
    duration: currentOptimizedRoute.duration,
    status: 'Saved'
  };

  history.unshift(newHistoryItem);
  saveRouteHistory(history);
  renderRouteHistory();

  if (typeof showToast === 'function') {
    showToast(`Route #${newRouteId} saved successfully for ${currentOptimizedRoute.driver}.`, 'success');
  }
}

function assignRoute() {
  if (!currentOptimizedRoute) {
    if (typeof showToast === 'function') {
      showToast('Please optimize route before assigning.', 'warning');
    }
    return;
  }

  const history = getRouteHistory();
  const newRouteId = `RT-${800 + history.length + 1}`;

  const newHistoryItem = {
    id: newRouteId,
    driver: currentOptimizedRoute.driver,
    date: currentOptimizedRoute.date,
    stops: currentOptimizedRoute.stopsCount,
    distance: currentOptimizedRoute.distance,
    duration: currentOptimizedRoute.duration,
    status: 'Dispatched'
  };

  history.unshift(newHistoryItem);
  saveRouteHistory(history);
  renderRouteHistory();

  // Synchronize assigned driver and status to sc_deliveries for live driver portal reflection
  try {
    const rawDeliveries = localStorage.getItem('sc_deliveries');
    if (rawDeliveries && currentOptimizedRoute.stops) {
      const allDeliveries = JSON.parse(rawDeliveries);
      const stopIds = currentOptimizedRoute.stops.map((s) => s.id);
      let updatedAny = false;
      allDeliveries.forEach((d) => {
        if (stopIds.includes(d.id)) {
          d.driver = currentOptimizedRoute.driver;
          if (d.status === 'Pending') {
            d.status = 'Assigned';
          }
          updatedAny = true;
        }
      });
      if (updatedAny) {
        localStorage.setItem('sc_deliveries', JSON.stringify(allDeliveries));
      }
    }
  } catch (_) {}

  // Update status badge
  currentOptimizedRoute.status = 'Dispatched';
  const statusEl = document.getElementById('summaryStatusBadge');
  if (statusEl) {
    statusEl.innerHTML = '<span class="status-badge status-badge-primary"><i class="bi bi-truck me-1"></i>Dispatched</span>';
  }

  if (typeof showToast === 'function') {
    showToast(`Route #${newRouteId} dispatched and assigned to ${currentOptimizedRoute.driver}!`, 'success');
  }
}

function resetRoute() {
  availableStops = getLiveAvailableStops();
  currentOptimizedRoute = null;

  renderAvailableStops();

  // Reset Summary
  const driverEl    = document.getElementById('summaryDriverName');
  const stopsEl     = document.getElementById('summaryStopsCount');
  const distanceEl  = document.getElementById('summaryTotalDistance');
  const durationEl  = document.getElementById('summaryTravelTime');
  const etaEl       = document.getElementById('summaryEta');
  const statusEl    = document.getElementById('summaryStatusBadge');

  if (driverEl)   driverEl.textContent   = 'Amit Patil';
  if (stopsEl)    stopsEl.textContent    = '0 Stops';
  if (distanceEl) distanceEl.textContent = '0 km';
  if (durationEl) durationEl.textContent = '0 mins';
  if (etaEl)      etaEl.textContent      = '—';
  if (statusEl) {
    statusEl.innerHTML = '<span class="status-badge status-badge-secondary">Pending Setup</span>';
  }

  // Reset Timeline
  const timelineContainer = document.getElementById('routeTimelineContainer');
  if (timelineContainer) {
    timelineContainer.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-signpost-2" style="font-size: 2rem; opacity: 0.5;"></i>
        <p class="small mt-2 mb-0">Select delivery stops and click <strong>"Optimize Route"</strong> to generate the stop sequence.</p>
      </div>
    `;
  }

  // Reset Map
  updateMapGraphic(null);

  // Disable Action Buttons
  const saveBtn = document.getElementById('btnSaveRoute');
  const assignBtn = document.getElementById('btnAssignRoute');
  if (saveBtn) saveBtn.disabled = true;
  if (assignBtn) assignBtn.disabled = true;

  if (typeof showToast === 'function') {
    showToast('Route configuration has been reset to defaults.', 'info');
  }
}

function loadDeliveries() {
  availableStops = getLiveAvailableStops();
  availableStops.forEach((s) => (s.selected = true));
  renderAvailableStops();
  if (typeof showToast === 'function') {
    showToast(`Loaded ${availableStops.length} delivery stops ready for optimization.`, 'info');
  }
}

/* ==========================================================================
   11. Route History Log Table Rendering
   ========================================================================== */
function renderRouteHistory() {
  const tbody = document.getElementById('routeHistoryTableBody');
  if (!tbody) return;

  const history = getRouteHistory();

  tbody.innerHTML = history
    .map(
      (rt) => `
    <tr>
      <td class="ps-4">
        <span class="fw-semibold text-primary font-monospace">${rt.id}</span>
      </td>
      <td>
        <div class="fw-semibold text-dark">${rt.driver}</div>
      </td>
      <td class="text-secondary" style="font-size:0.8125rem;">
        ${rt.date}
      </td>
      <td>
        <span class="badge bg-light text-dark border px-2 py-1 fw-medium">${rt.stops} stops</span>
      </td>
      <td class="font-monospace text-secondary" style="font-size:0.8125rem;">
        ${rt.distance}
      </td>
      <td>
        ${
          rt.status === 'Completed'
            ? '<span class="status-badge status-badge-success">Completed</span>'
            : rt.status === 'Dispatched'
            ? '<span class="status-badge status-badge-primary">Dispatched</span>'
            : rt.status === 'Optimized'
            ? '<span class="status-badge status-badge-purple">Optimized</span>'
            : '<span class="status-badge status-badge-secondary">Saved</span>'
        }
      </td>
      <td class="pe-4 text-end">
        <button class="btn btn-sm btn-light border p-1 px-2 text-secondary btn-rerun-route" type="button" data-driver="${rt.driver}" style="font-size:0.75rem;" title="Load this route">
          <i class="bi bi-arrow-repeat me-1"></i>Load
        </button>
      </td>
    </tr>
  `
    )
    .join('');

  tbody.querySelectorAll('.btn-rerun-route').forEach((btn) => {
    btn.addEventListener('click', () => {
      const driver = btn.getAttribute('data-driver');
      const driverSelect = document.getElementById('routeSelectDriver');
      if (driverSelect) driverSelect.value = driver;
      optimizeRoute();
    });
  });
}

/* ==========================================================================
   12. Global Page Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  renderAvailableStops();
  renderRouteHistory();

  // Attach Header & Section Buttons
  const headerOptimizeBtn = document.getElementById('btnHeaderOptimize');
  const sectionOptimizeBtn = document.getElementById('btnOptimizeRoute');
  const headerResetBtn = document.getElementById('btnHeaderReset');
  const loadDeliveriesBtn = document.getElementById('btnLoadDeliveries');
  const saveRouteBtn = document.getElementById('btnSaveRoute');
  const assignRouteBtn = document.getElementById('btnAssignRoute');
  const viewDriverRouteBtn = document.getElementById('btnViewDriverRoute');

  if (headerOptimizeBtn) headerOptimizeBtn.addEventListener('click', () => optimizeRoute(true));
  if (sectionOptimizeBtn) sectionOptimizeBtn.addEventListener('click', () => optimizeRoute(true));
  if (headerResetBtn) headerResetBtn.addEventListener('click', resetRoute);
  if (loadDeliveriesBtn) loadDeliveriesBtn.addEventListener('click', loadDeliveries);
  if (saveRouteBtn) saveRouteBtn.addEventListener('click', saveRoute);
  if (assignRouteBtn) assignRouteBtn.addEventListener('click', assignRoute);

  if (viewDriverRouteBtn) {
    viewDriverRouteBtn.addEventListener('click', () => {
      window.location.href = '../driver/my-route.html';
    });
  }

  // Auto-run initial demo optimization so the user immediately sees the populated UI
  optimizeRoute();
});
