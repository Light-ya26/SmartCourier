/**
 * SmartCourier – Driver Experience Module (driver.js)
 * --------------------------------------------------------------------------
 * Handles:
 * 1. Driver Dashboard stats calculation (Today's Deliveries, Pending, In Transit, Delivered)
 * 2. Today's deliveries list rendering with "View" action
 * 3. "My Route" view with route metrics and stop sequence actions (View, Mark Delivered, Failed)
 * 4. "Delivery Details" view with complete parcel specs and status actions
 * 5. Strict status flow transition rules (Pending -> Assigned -> In Transit -> Delivered / Failed)
 * 6. Confirmation modal for significant status changes
 * 7. State synchronization with shared localStorage key ('sc_deliveries')
 * --------------------------------------------------------------------------
 */

'use strict';

const STORAGE_KEY = 'sc_deliveries';
const CURRENT_DRIVER_NAME = 'Amit Patil';
const CURRENT_ROUTE_ID = 'RT-801';

/* Default fallback deliveries for Driver if localStorage is uninitialized */
const DEFAULT_DRIVER_DELIVERIES = [
  {
    id: "SC-1001",
    customer: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul.sharma@example.com",
    address: "Flat 402, MG Road, Camp",
    city: "Pune",
    postalCode: "411001",
    latitude: 18.5204,
    longitude: 73.8567,
    package: "Electronics (ThinkPad Laptop)",
    weight: "2.4 kg",
    priority: "High",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "In Transit",
    notes: "Fragile electronic parcel. Security verification code required at doorstep."
  },
  {
    id: "SC-1004",
    customer: "Sneha Joshi",
    phone: "+91 91234 56780",
    email: "sneha.joshi@example.com",
    address: "Suite 301, EON IT Park, Kharadi",
    city: "Pune",
    postalCode: "411014",
    latitude: 18.5529,
    longitude: 73.9515,
    package: "Legal Documents (Contract Portfolio)",
    weight: "0.5 kg",
    priority: "Normal",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Assigned",
    notes: "Deliver directly to 3rd floor reception desk. Obtain signoff."
  },
  {
    id: "SC-1005",
    customer: "Vikram Malhotra",
    phone: "+91 99887 76655",
    email: "vikram.m@example.com",
    address: "Plot 88, Kalyani Nagar",
    city: "Pune",
    postalCode: "411006",
    latitude: 18.5463,
    longitude: 73.9033,
    package: "Healthcare Device (Blood Pressure Monitor)",
    weight: "1.2 kg",
    priority: "High",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Delivered",
    notes: "Customer confirmed delivery code 7741. Successfully delivered."
  },
  {
    id: "SC-1002",
    customer: "Priya Deshmukh",
    phone: "+91 98234 56789",
    email: "priya.d@example.com",
    address: "Bungalow 12, Riverview Park, Alandi",
    city: "Pune",
    postalCode: "412105",
    latitude: 18.6754,
    longitude: 73.8992,
    package: "Medical Supplies (Insulin Kit)",
    weight: "0.8 kg",
    priority: "Normal",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Assigned",
    notes: "Cold-pack parcel. Deliver before 3:00 PM."
  },
  {
    id: "SC-1006",
    customer: "Ananya Iyer",
    phone: "+91 98112 23344",
    email: "ananya.iyer@example.com",
    address: "Row House 7, Amanora Park Town, Hadapsar",
    city: "Pune",
    postalCode: "411028",
    latitude: 18.5089,
    longitude: 73.9341,
    package: "Designer Apparel",
    weight: "1.9 kg",
    priority: "High",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Assigned",
    notes: "Call 10 minutes prior to delivery. Gate entry code: #4092."
  },
  {
    id: "SC-1007",
    customer: "Tanmay Bhatnagar",
    phone: "+91 97531 24680",
    email: "tanmay.b@example.com",
    address: "Apex Heights, FC Road, Shivaji Nagar",
    city: "Pune",
    postalCode: "411005",
    latitude: 18.5314,
    longitude: 73.8446,
    package: "Smart Home Security Camera",
    weight: "1.1 kg",
    priority: "Normal",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Pending",
    notes: "Leave with security guard if recipient is unavailable."
  }
];

/* State Accessors */
function getAllDeliveries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DRIVER_DELIVERIES));
      return DEFAULT_DRIVER_DELIVERIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DRIVER_DELIVERIES;
  } catch (_) {
    return DEFAULT_DRIVER_DELIVERIES;
  }
}

function saveAllDeliveries(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function getDriverDeliveries() {
  const all = getAllDeliveries();
  // Filter for Amit Patil or unassigned that match driver schedule
  const driverItems = all.filter(d => !d.driver || d.driver === CURRENT_DRIVER_NAME);
  return driverItems.length > 0 ? driverItems : DEFAULT_DRIVER_DELIVERIES;
}

function getDeliveryById(id) {
  const all = getAllDeliveries();
  return all.find(d => d.id === id) || null;
}

/* Status Flow Logic */
const VALID_TRANSITIONS = {
  'Pending':    ['Assigned', 'In Transit'],
  'Assigned':   ['In Transit'],
  'In Transit': ['Delivered', 'Failed'],
  'Failed':     ['In Transit'], // Driver can re-attempt failed stop
  'Delivered':  []              // Terminal state
};

function canTransition(currentStatus, targetStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

function updateDeliveryStatus(id, newStatus, failureReason = '') {
  const all = getAllDeliveries();
  const index = all.findIndex(d => d.id === id);
  if (index === -1) return false;

  const current = all[index];
  if (!canTransition(current.status, newStatus)) {
    if (typeof showToast === 'function') {
      showToast(`Cannot change status from "${current.status}" to "${newStatus}".`, 'warning');
    }
    return false;
  }

  all[index].status = newStatus;
  if (failureReason) {
    all[index].notes = (all[index].notes ? all[index].notes + ' | ' : '') + `Failed: ${failureReason}`;
  }

  saveAllDeliveries(all);

  if (typeof showToast === 'function') {
    showToast(`Delivery ${id} marked as ${newStatus}.`, 'success');
  }
  return true;
}

/* Helper: Render Status Badge HTML */
function renderStatusBadge(status) {
  switch (status) {
    case 'Delivered':
      return `<span class="status-badge status-badge-success"><i class="bi bi-check-circle-fill me-1"></i>Delivered</span>`;
    case 'In Transit':
      return `<span class="status-badge status-badge-primary"><i class="bi bi-truck me-1"></i>In Transit</span>`;
    case 'Assigned':
      return `<span class="status-badge status-badge-info"><i class="bi bi-person-check-fill me-1"></i>Assigned</span>`;
    case 'Pending':
      return `<span class="status-badge status-badge-warning"><i class="bi bi-clock-fill me-1"></i>Pending</span>`;
    case 'Failed':
      return `<span class="status-badge status-badge-danger"><i class="bi bi-x-circle-fill me-1"></i>Failed</span>`;
    default:
      return `<span class="status-badge status-badge-secondary">${status}</span>`;
  }
}

/* Helper: Render Priority Badge HTML */
function renderPriorityBadge(priority) {
  if (priority === 'High') {
    return `<span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold" style="font-size:0.7rem;"><i class="bi bi-fire me-1"></i>High</span>`;
  } else if (priority === 'Low') {
    return `<span class="badge bg-light text-muted border" style="font-size:0.7rem;">Low</span>`;
  }
  return `<span class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size:0.7rem;">Normal</span>`;
}

/* Step 9 Helpers: Visual Delivery Status Timeline, Driver Card & Activity Log */
function generateStatusTimelineHtml(status) {
  const isFailed = status === 'Failed';
  
  const stages = [
    { key: 'Created', label: 'Created', sub: '09:15 AM', icon: 'bi-box-seam' },
    { key: 'Assigned', label: 'Assigned', sub: '10:20 AM', icon: 'bi-person-check' },
    { key: 'In Transit', label: 'In Transit', sub: '12:15 PM', icon: 'bi-truck' },
    { key: 'Out for Delivery', label: 'Out for Delivery', sub: '12:45 PM', icon: 'bi-geo-alt' },
    isFailed
      ? { key: 'Failed', label: 'Failed', sub: '01:05 PM', icon: 'bi-x-circle' }
      : { key: 'Delivered', label: 'Delivered', sub: '01:05 PM', icon: 'bi-check2-circle' }
  ];

  let currentStageIndex = 0;
  if (status === 'Pending') currentStageIndex = 0;
  else if (status === 'Assigned') currentStageIndex = 1;
  else if (status === 'In Transit') currentStageIndex = 2;
  else if (status === 'Out for Delivery') currentStageIndex = 3;
  else if (status === 'Delivered') currentStageIndex = 4;
  else if (status === 'Failed') currentStageIndex = 4;

  const progressPercent = Math.min(100, Math.round((currentStageIndex / (stages.length - 1)) * 100));

  return `
    <div class="delivery-stepper-container">
      <div class="stepper-progress-track">
        <div class="stepper-progress-fill ${isFailed ? 'bg-danger' : ''}" style="width: ${progressPercent}%;"></div>
      </div>
      <div class="delivery-stepper">
        ${stages.map((stage, idx) => {
          let nodeClass = '';
          if (isFailed && idx === 4) {
            nodeClass = 'failed';
          } else if (idx < currentStageIndex) {
            nodeClass = 'completed';
          } else if (idx === currentStageIndex) {
            nodeClass = isFailed ? 'failed' : 'active';
          }

          return `
            <div class="stepper-node ${nodeClass}">
              <div class="stepper-node-icon">
                <i class="bi ${stage.icon}"></i>
              </div>
              <div class="stepper-node-label">${stage.label}</div>
              <div class="stepper-node-subtext">${idx <= currentStageIndex ? stage.sub : 'Upcoming'}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function generateDriverInfoCardHtml(driverName) {
  if (!driverName || driverName === 'Unassigned') {
    return `
      <div class="p-3 bg-light rounded border text-center text-muted">
        <i class="bi bi-person-x fs-4 d-block mb-1 text-secondary"></i>
        <div class="small fw-semibold text-dark">No driver assigned</div>
        <p class="small text-muted mb-0">Use the Edit page or Route Optimization to allocate a driver.</p>
      </div>
    `;
  }

  return `
    <div class="p-3 bg-light rounded border d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div class="d-flex align-items-center gap-3">
        <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold" style="width:42px; height:42px; font-size:1rem;">
          ${driverName.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div class="fw-bold text-dark fs-6">${driverName}</div>
          <div class="text-muted small"><i class="bi bi-telephone me-1"></i>+91 98220 12345 &bull; <i class="bi bi-truck me-1"></i>Delivery Van (MH-12-DE-4412)</div>
        </div>
      </div>
      <span class="status-badge status-badge-primary">
        <i class="bi bi-geo-alt-fill me-1"></i>Active on Route
      </span>
    </div>
  `;
}

function generateActivityLogHtml(delivery) {
  const isDelivered = delivery.status === 'Delivered';
  const isFailed = delivery.status === 'Failed';
  const isInTransit = delivery.status === 'In Transit' || delivery.status === 'Out for Delivery' || isDelivered || isFailed;
  const isAssigned = delivery.status !== 'Pending';

  return `
    <ul class="activity-log-list">
      <li class="activity-log-item">
        <div class="activity-log-bullet success"></div>
        <div class="activity-log-time">09:15 AM &bull; Dispatch Order Created</div>
        <div class="activity-log-desc">Parcel ${delivery.id} booked and package labeled for dispatch.</div>
      </li>
      ${isAssigned ? `
        <li class="activity-log-item">
          <div class="activity-log-bullet success"></div>
          <div class="activity-log-time">10:20 AM &bull; Assigned to Driver</div>
          <div class="activity-log-desc">Delivery assigned to courier <strong>${delivery.driver || 'Amit Patil'}</strong>.</div>
        </li>
      ` : ''}
      ${isInTransit ? `
        <li class="activity-log-item">
          <div class="activity-log-bullet success"></div>
          <div class="activity-log-time">11:05 AM &bull; Route Started</div>
          <div class="activity-log-desc">Driver departed Pune Central Depot with delivery batch.</div>
        </li>
        <li class="activity-log-item">
          <div class="activity-log-bullet ${isFailed ? 'danger' : 'success'}"></div>
          <div class="activity-log-time">12:15 PM &bull; Marked In Transit</div>
          <div class="activity-log-desc">Courier en route to ${delivery.customer}'s address.</div>
        </li>
      ` : ''}
      ${isDelivered ? `
        <li class="activity-log-item">
          <div class="activity-log-bullet success"></div>
          <div class="activity-log-time">01:05 PM &bull; Delivery Marked Delivered</div>
          <div class="activity-log-desc">Parcel handed over to customer. Signed on mobile terminal.</div>
        </li>
      ` : ''}
      ${isFailed ? `
        <li class="activity-log-item">
          <div class="activity-log-bullet danger"></div>
          <div class="activity-log-time">01:05 PM &bull; Delivery Attempt Failed</div>
          <div class="activity-log-desc">${delivery.notes || 'Customer unavailable at destination address.'}</div>
        </li>
      ` : ''}
    </ul>
  `;
}

/* ==========================================================================
   1. DRIVER DASHBOARD LOGIC
   ========================================================================== */
function initDriverDashboard() {
  const deliveries = getDriverDeliveries();

  // 1. KPI Counts
  const total = deliveries.length;
  const pending = deliveries.filter(d => d.status === 'Pending' || d.status === 'Assigned').length;
  const inTransit = deliveries.filter(d => d.status === 'In Transit').length;
  const delivered = deliveries.filter(d => d.status === 'Delivered').length;

  const statTotal = document.getElementById('statDriverTotal');
  const statPending = document.getElementById('statDriverPending');
  const statInTransit = document.getElementById('statDriverInTransit');
  const statDelivered = document.getElementById('statDriverDelivered');

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statInTransit) statInTransit.textContent = inTransit;
  if (statDelivered) statDelivered.textContent = delivered;

  // 2. Render Today's Deliveries Table
  const tableBody = document.getElementById('driverDeliveriesTableBody');
  if (tableBody) {
    if (deliveries.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-0 border-0">
            <div class="sc-empty-state py-5">
              <div class="sc-empty-state-icon">
                <i class="bi bi-inbox"></i>
              </div>
              <h6 class="sc-empty-state-title">No deliveries found</h6>
              <p class="sc-empty-state-text">You have no active deliveries scheduled for today.</p>
              <a href="my-route.html" class="secondary-button btn-sm-custom">
                <i class="bi bi-map"></i> View Route Schedule
              </a>
            </div>
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = deliveries.map(d => `
        <tr>
          <td class="ps-4">
            <span class="fw-bold font-monospace text-primary">${d.id}</span>
          </td>
          <td>
            <div class="fw-semibold text-dark">${d.customer}</div>
            <div class="text-muted small">${d.phone || '+91 98000 00000'}</div>
          </td>
          <td>
            <div class="text-secondary text-truncate" style="max-width:240px;" title="${d.address}">
              <i class="bi bi-geo-alt me-1 text-muted"></i>${d.address}
            </div>
          </td>
          <td>
            ${renderPriorityBadge(d.priority)}
          </td>
          <td>
            ${renderStatusBadge(d.status)}
          </td>
          <td class="pe-4 text-end">
            <a href="delivery-details.html?id=${d.id}" class="secondary-button btn-sm-custom" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
              <i class="bi bi-eye me-1"></i> View
            </a>
          </td>
        </tr>
      `).join('');
    }
  }
}

/* ==========================================================================
   2. DRIVER MY ROUTE LOGIC
   ========================================================================== */
let pendingConfirmAction = null;

function initDriverRoute() {
  const deliveries = getDriverDeliveries();

  // Metrics
  const totalStops = deliveries.length;
  const completedStops = deliveries.filter(d => d.status === 'Delivered').length;
  const remainingStops = totalStops - completedStops;
  const totalDistance = '18.4 km';
  const estimatedTime = '48 mins';

  const elDriverName = document.getElementById('routeDriverName');
  const elRouteId = document.getElementById('routeIdBadge');
  const elDate = document.getElementById('routeTodayDate');
  const elTotalStops = document.getElementById('routeTotalStops');
  const elCompletedStops = document.getElementById('routeCompletedStops');
  const elRemainingStops = document.getElementById('routeRemainingStops');
  const elDistance = document.getElementById('routeTotalDistance');
  const elTime = document.getElementById('routeEstimatedTime');
  const elProgress = document.getElementById('routeProgressBar');
  const elProgressPct = document.getElementById('routeProgressPercent');

  if (elDriverName) elDriverName.textContent = CURRENT_DRIVER_NAME;
  if (elRouteId) elRouteId.textContent = CURRENT_ROUTE_ID;
  if (elDate) {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    elDate.textContent = today;
  }
  if (elTotalStops) elTotalStops.textContent = totalStops;
  if (elCompletedStops) elCompletedStops.textContent = completedStops;
  if (elRemainingStops) elRemainingStops.textContent = remainingStops;
  if (elDistance) elDistance.textContent = totalDistance;
  if (elTime) elTime.textContent = estimatedTime;

  const pct = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;
  if (elProgress) elProgress.style.width = `${pct}%`;
  if (elProgressPct) elProgressPct.textContent = `${pct}%`;

  // Render Stop Sequence
  const sequenceContainer = document.getElementById('routeSequenceContainer');
  if (sequenceContainer) {
    if (deliveries.length === 0) {
      sequenceContainer.innerHTML = `
        <div class="sc-empty-state">
          <div class="sc-empty-state-icon">
            <i class="bi bi-map"></i>
          </div>
          <h5 class="sc-empty-state-title">No route available</h5>
          <p class="sc-empty-state-text">No delivery stops have been assigned to your active route for today.</p>
          <a href="dashboard.html" class="secondary-button btn-sm-custom">
            <i class="bi bi-grid-1x2"></i> Back to Dashboard
          </a>
        </div>
      `;
      return;
    }

    sequenceContainer.innerHTML = deliveries.map((stop, index) => {
      const isDelivered = stop.status === 'Delivered';
      const isFailed = stop.status === 'Failed';
      const isInTransit = stop.status === 'In Transit';

      return `
        <div class="content-card mb-3 border ${isInTransit ? 'border-primary shadow-sm' : ''}" style="${isDelivered ? 'opacity:0.85; background:#FAFAFA;' : ''}">
          <div class="content-card-body p-3">
            <div class="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
              <div class="d-flex align-items-center gap-2">
                <span class="badge ${isDelivered ? 'bg-success text-white' : isInTransit ? 'bg-primary text-white' : isFailed ? 'bg-danger text-white' : 'bg-dark text-white'}" style="font-size:0.75rem; padding: 0.35rem 0.6rem;">
                  Stop ${index + 1}
                </span>
                <span class="fw-bold font-monospace text-primary">${stop.id}</span>
                ${renderPriorityBadge(stop.priority)}
              </div>
              <div>
                ${renderStatusBadge(stop.status)}
              </div>
            </div>

            <div class="row g-2 mb-3">
              <div class="col-sm-6">
                <div class="text-muted small" style="font-size:0.75rem;">CUSTOMER</div>
                <div class="fw-semibold text-dark">${stop.customer}</div>
                <div class="text-muted small">${stop.phone || '+91 98000 00000'}</div>
              </div>
              <div class="col-sm-6">
                <div class="text-muted small" style="font-size:0.75rem;">DELIVERY ADDRESS</div>
                <div class="text-dark small"><i class="bi bi-geo-alt me-1 text-danger"></i>${stop.address}</div>
              </div>
            </div>

            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top">
              <div class="text-muted small">
                <i class="bi bi-box me-1"></i>${stop.package || 'Standard Courier Parcel'}
              </div>
              <div class="d-flex align-items-center gap-2">
                <a href="delivery-details.html?id=${stop.id}" class="secondary-button btn-sm-custom" style="padding:0.35rem 0.75rem; font-size:0.8rem;">
                  <i class="bi bi-eye me-1"></i> View Delivery
                </a>
                
                ${
                  !isDelivered
                    ? `
                      <button type="button" class="btn btn-outline-danger btn-sm-custom btn-fail-stop" data-id="${stop.id}" data-customer="${stop.customer}" style="padding:0.35rem 0.75rem; font-size:0.8rem; border-radius: var(--radius-md);">
                        <i class="bi bi-x-circle me-1"></i> Failed
                      </button>
                      <button type="button" class="btn btn-success btn-sm-custom btn-deliver-stop" data-id="${stop.id}" data-customer="${stop.customer}" style="padding:0.35rem 0.75rem; font-size:0.8rem; border-radius: var(--radius-md);">
                        <i class="bi bi-check2-circle me-1"></i> Mark Delivered
                      </button>
                    `
                    : `
                      <span class="text-success small fw-semibold"><i class="bi bi-check-all me-1"></i>Completed</span>
                    `
                }
              </div>
            </div>

          </div>
        </div>
      `;
    }).join('');

    // Attach Listeners to Deliver / Fail buttons in route
    sequenceContainer.querySelectorAll('.btn-deliver-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const customer = btn.getAttribute('data-customer');
        openConfirmModal(id, 'Delivered', `Confirm delivery of parcel <strong>#${id}</strong> to <strong>${customer}</strong>?`);
      });
    });

    sequenceContainer.querySelectorAll('.btn-fail-stop').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const customer = btn.getAttribute('data-customer');
        openConfirmModal(id, 'Failed', `Mark delivery <strong>#${id}</strong> for <strong>${customer}</strong> as Failed / Customer Unavailable?`);
      });
    });
  }
}

/* ==========================================================================
   3. DRIVER DELIVERY DETAILS LOGIC
   ========================================================================== */
function initDeliveryDetails() {
  const params = new URLSearchParams(window.location.search);
  const deliveryId = params.get('id') || 'SC-1001';

  const delivery = getDeliveryById(deliveryId);

  if (!delivery) {
    if (typeof showToast === 'function') {
      showToast(`Delivery #${deliveryId} not found.`, 'warning');
    }
    return;
  }

  // Populate Fields
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('detailDeliveryId', delivery.id);
  setText('detailBreadcrumbId', delivery.id);
  setText('detailCustomer', delivery.customer);
  setText('detailPhone', delivery.phone || '+91 98765 43210');
  setText('detailEmail', delivery.email || 'customer@example.com');
  setText('detailAddress', delivery.address);
  setText('detailCityZip', `${delivery.city || 'Pune'} – ${delivery.postalCode || '411001'}`);
  setText('detailPackage', delivery.package || 'Standard Courier Package');
  setText('detailWeight', delivery.weight || '1.0 kg');
  setText('detailDriver', delivery.driver || CURRENT_DRIVER_NAME);
  setText('detailDate', delivery.displayDate || delivery.date || '08 Oct 2026');
  setText('detailNotes', delivery.notes || 'No special delivery instructions provided.');

  const priorityEl = document.getElementById('detailPriority');
  if (priorityEl) priorityEl.innerHTML = renderPriorityBadge(delivery.priority);

  const statusEl = document.getElementById('detailStatus');
  if (statusEl) statusEl.innerHTML = renderStatusBadge(delivery.status);

  // 1. Status Timeline
  const timelineEl = document.getElementById('detailTimelineContainer');
  if (timelineEl) timelineEl.innerHTML = generateStatusTimelineHtml(delivery.status);

  // 2. Driver Information
  const driverEl = document.getElementById('detailDriverCard');
  if (driverEl) driverEl.innerHTML = generateDriverInfoCardHtml(delivery.driver);

  // 3. Activity Log
  const activityEl = document.getElementById('detailActivityLog');
  if (activityEl) activityEl.innerHTML = generateActivityLogHtml(delivery);

  // Status Action Buttons State
  const btnStart      = document.getElementById('btnActionStart');
  const btnInTransit  = document.getElementById('btnActionInTransit');
  const btnDelivered  = document.getElementById('btnActionDelivered');
  const btnFailed     = document.getElementById('btnActionFailed');

  // Disable / Enable according to valid transitions
  if (btnStart) {
    btnStart.disabled = !canTransition(delivery.status, 'In Transit');
  }
  if (btnInTransit) {
    btnInTransit.disabled = !canTransition(delivery.status, 'In Transit');
  }
  if (btnDelivered) {
    btnDelivered.disabled = !canTransition(delivery.status, 'Delivered');
  }
  if (btnFailed) {
    btnFailed.disabled = !canTransition(delivery.status, 'Failed');
  }

  // Wire Status Buttons
  if (btnStart) {
    btnStart.onclick = () => {
      openConfirmModal(delivery.id, 'In Transit', `Start delivery dispatch for parcel <strong>#${delivery.id}</strong>?`);
    };
  }
  if (btnInTransit) {
    btnInTransit.onclick = () => {
      openConfirmModal(delivery.id, 'In Transit', `Mark parcel <strong>#${delivery.id}</strong> as In Transit?`);
    };
  }
  if (btnDelivered) {
    btnDelivered.onclick = () => {
      openConfirmModal(delivery.id, 'Delivered', `Confirm that parcel <strong>#${delivery.id}</strong> was successfully handed over to <strong>${delivery.customer}</strong>?`);
    };
  }
  if (btnFailed) {
    btnFailed.onclick = () => {
      openConfirmModal(delivery.id, 'Failed', `Mark parcel <strong>#${delivery.id}</strong> delivery as Failed / Delivery Attempt Unsuccessful?`);
    };
  }
}

/* ==========================================================================
   4. MODAL CONFIRMATION HANDLER
   ========================================================================== */
function openConfirmModal(deliveryId, targetStatus, messageHtml) {
  pendingConfirmAction = { deliveryId, targetStatus };

  const modalMsg = document.getElementById('confirmModalMessage');
  const modalTargetStatus = document.getElementById('confirmModalTargetStatus');
  const failureReasonGroup = document.getElementById('failureReasonGroup');

  if (modalMsg) modalMsg.innerHTML = messageHtml;
  if (modalTargetStatus) modalTargetStatus.textContent = targetStatus;

  // Show failure reason dropdown only for Failed status
  if (failureReasonGroup) {
    failureReasonGroup.style.display = (targetStatus === 'Failed') ? 'block' : 'none';
  }

  // Open modal via Bootstrap 5
  const modalEl = document.getElementById('driverStatusConfirmModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInstance.show();
  }
}

function handleConfirmStatusChange() {
  if (!pendingConfirmAction) return;

  const { deliveryId, targetStatus } = pendingConfirmAction;
  let reason = '';
  if (targetStatus === 'Failed') {
    const reasonSelect = document.getElementById('failureReasonSelect');
    reason = reasonSelect ? reasonSelect.value : 'Customer Unavailable';
  }

  const success = updateDeliveryStatus(deliveryId, targetStatus, reason);

  // Close modal
  const modalEl = document.getElementById('driverStatusConfirmModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
  }

  pendingConfirmAction = null;

  if (success) {
    // Re-initialize current view
    if (document.getElementById('statDriverTotal')) {
      initDriverDashboard();
    } else if (document.getElementById('routeSequenceContainer')) {
      initDriverRoute();
    } else if (document.getElementById('detailDeliveryId')) {
      initDeliveryDetails();
    }
  }
}

/* ==========================================================================
   5. PAGE INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Confirm Button in Modal
  const confirmBtn = document.getElementById('btnConfirmStatusChange');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', handleConfirmStatusChange);
  }

  // Detect which driver page is active
  if (document.getElementById('statDriverTotal')) {
    initDriverDashboard();
  } else if (document.getElementById('routeSequenceContainer')) {
    initDriverRoute();
  } else if (document.getElementById('detailDeliveryId')) {
    initDeliveryDetails();
  }
});
