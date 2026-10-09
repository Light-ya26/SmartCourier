/**
 * SmartCourier – Delivery Management Module (deliveries.js)
 * --------------------------------------------------------------------------
 * Handles:
 * 1. Centralized delivery state management (localStorage persistence with demo fallback)
 * 2. Multi-column table rendering with responsive badges
 * 3. Frontend search & combined filters (Status, Driver, Priority, Date)
 * 4. "View Details" interactive modal
 * 5. "Delete Delivery" Bootstrap confirmation modal
 * 6. "Add Delivery" form validation & persistence
 * 7. "Edit Delivery" URL ID reader (?id=SC-XXXX), pre-fill, validation & update
 * 8. API-Ready function contracts for future ASP.NET Core Web API integration
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   1. API Endpoint Constants (Prepared for future ASP.NET Core Web API)
   ========================================================================== */
const DELIVERY_API_ENDPOINTS = Object.freeze({
  GET_DELIVERIES:   '/api/deliveries',
  GET_DELIVERY:     (id) => `/api/deliveries/${id}`,
  CREATE_DELIVERY:  '/api/deliveries',
  UPDATE_DELIVERY:  (id) => `/api/deliveries/${id}`,
  DELETE_DELIVERY:  (id) => `/api/deliveries/${id}`,
});

/* ==========================================================================
   2. Initial Realistic Demo Deliveries (At least 8 records)
   ========================================================================== */
const INITIAL_DEMO_DELIVERIES = [
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
    driver: "Rohit Jadhav",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Pending",
    notes: "Cold-pack parcel. Deliver before 3:00 PM."
  },
  {
    id: "SC-1003",
    customer: "Aditya Kulkarni",
    address: "Tower B, Pristine Palms, Wakad",
    phone: "+91 97654 32109",
    email: "aditya.k@example.com",
    city: "Pune",
    postalCode: "411057",
    latitude: 18.5987,
    longitude: 73.7654,
    package: "Apparel & Shoes",
    weight: "1.5 kg",
    priority: "High",
    driver: "Sahil More",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Delivered",
    notes: "Left with recipient in person. Signed on delivery app."
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
    weight: "0.4 kg",
    priority: "Normal",
    driver: "Aman Shinde",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Assigned",
    notes: "Hand over directly to reception front desk."
  },
  {
    id: "SC-1005",
    customer: "Vikram Patil",
    phone: "+91 99887 76655",
    email: "vikram.patil@example.com",
    address: "Phase 2, Blue Ridge, Hinjawadi",
    city: "Pune",
    postalCode: "411057",
    latitude: 18.5913,
    longitude: 73.7389,
    package: "Automobile Spare Parts",
    weight: "4.8 kg",
    priority: "Low",
    driver: "Karan Verma",
    date: "2026-10-07",
    displayDate: "07 Oct 2026",
    status: "Failed",
    notes: "Delivery attempt failed: Recipient not reachable on phone."
  },
  {
    id: "SC-1006",
    customer: "Ananya Iyer",
    phone: "+91 98760 12345",
    email: "ananya.iyer@example.com",
    address: "Row House 7, Amanora Park Town, Hadapsar",
    city: "Pune",
    postalCode: "411028",
    latitude: 18.5089,
    longitude: 73.9341,
    package: "Gourmet Gift Hamper",
    weight: "3.2 kg",
    priority: "High",
    driver: "Amit Patil",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "In Transit",
    notes: "Perishable festive gift. Keep in upright orientation."
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
    driver: "Rohit Jadhav",
    date: "2026-10-08",
    displayDate: "08 Oct 2026",
    status: "Pending",
    notes: "Leave with security guard if recipient is unavailable."
  },
  {
    id: "SC-1008",
    customer: "Meera Nair",
    phone: "+91 98989 89898",
    email: "meera.nair@example.com",
    address: "Greenwood Society, Baner Road",
    city: "Pune",
    postalCode: "411045",
    latitude: 18.5590,
    longitude: 73.7868,
    package: "Textbooks & Stationery Kit",
    weight: "2.0 kg",
    priority: "Low",
    driver: "Sahil More",
    date: "2026-10-06",
    displayDate: "06 Oct 2026",
    status: "Delivered",
    notes: "Standard doorstep contactless delivery completed."
  }
];

const STORAGE_KEY = 'sc_deliveries';

/* ==========================================================================
   3. Local State Management (Future API Bridge)
   ========================================================================== */
function getDeliveries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DELIVERIES));
      return INITIAL_DEMO_DELIVERIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DELIVERIES));
      return INITIAL_DEMO_DELIVERIES;
    }
    return parsed;
  } catch (err) {
    console.warn('[SmartCourier] Storage read failed:', err);
    return INITIAL_DEMO_DELIVERIES;
  }
}

function saveDeliveries(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('[SmartCourier] Storage write failed:', err);
  }
}

function getDeliveryById(id) {
  const list = getDeliveries();
  return list.find((d) => d.id === id) || null;
}

/* ==========================================================================
   4. UI Badge Formatters
   ========================================================================== */
function getStatusBadge(status) {
  switch (status) {
    case 'Pending':
      return '<span class="status-badge status-badge-warning"><i class="bi bi-clock me-1"></i>Pending</span>';
    case 'Assigned':
      return '<span class="status-badge status-badge-info"><i class="bi bi-person-check me-1"></i>Assigned</span>';
    case 'In Transit':
      return '<span class="status-badge status-badge-primary"><i class="bi bi-truck me-1"></i>In Transit</span>';
    case 'Delivered':
      return '<span class="status-badge status-badge-success"><i class="bi bi-check-circle me-1"></i>Delivered</span>';
    case 'Failed':
      return '<span class="status-badge status-badge-danger"><i class="bi bi-x-circle me-1"></i>Failed</span>';
    default:
      return `<span class="status-badge status-badge-secondary">${status}</span>`;
  }
}

function getPriorityBadge(priority) {
  switch (priority) {
    case 'High':
      return '<span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold px-2 py-1"><i class="bi bi-exclamation-triangle-fill me-1"></i>High</span>';
    case 'Normal':
      return '<span class="badge bg-light text-dark border fw-medium px-2 py-1"><i class="bi bi-dash-circle me-1 text-muted"></i>Normal</span>';
    case 'Low':
      return '<span class="badge bg-light text-muted border fw-normal px-2 py-1"><i class="bi bi-arrow-down-circle me-1"></i>Low</span>';
    default:
      return `<span class="badge bg-light text-muted border px-2 py-1">${priority}</span>`;
  }
}

/* ==========================================================================
   5. Deliveries Management Page Controller (admin/deliveries.html)
   ========================================================================== */
function initDeliveriesListPage() {
  const tableBody = document.getElementById('deliveriesTableBody');
  const table = document.getElementById('deliveriesTable');
  const emptyState = document.getElementById('deliveriesEmptyState');
  const searchInput = document.getElementById('deliverySearchInput');
  const statusFilter = document.getElementById('filterStatus');
  const driverFilter = document.getElementById('filterDriver');
  const priorityFilter = document.getElementById('filterPriority');
  const dateFilter = document.getElementById('filterDate');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const countBadge = document.getElementById('deliveryCountBadge');

  if (!tableBody) return; // Not on deliveries.html

  // Populate Driver filter options dynamically from current roster
  if (driverFilter) {
    const list = getDeliveries();
    const drivers = [...new Set(list.map((d) => d.driver).filter((drv) => drv && drv !== 'Unassigned'))];
    drivers.forEach((drv) => {
      const opt = document.createElement('option');
      opt.value = drv;
      opt.textContent = drv;
      driverFilter.appendChild(opt);
    });
  }

  function renderTable(list) {
    if (!list || list.length === 0) {
      tableBody.innerHTML = '';
      if (table) table.classList.add('d-none');
      if (emptyState) emptyState.classList.remove('d-none');
      if (countBadge) countBadge.textContent = '0 records';
      return;
    }

    if (table) table.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');
    if (countBadge) countBadge.textContent = `${list.length} of ${getDeliveries().length} deliveries`;

    tableBody.innerHTML = list
      .map(
        (d) => `
      <tr>
        <td class="ps-4">
          <span class="fw-semibold text-primary font-monospace">${d.id}</span>
        </td>
        <td>
          <div class="fw-semibold text-dark">${d.customer}</div>
          <div class="text-muted" style="font-size:0.75rem;"><i class="bi bi-telephone me-1"></i>${d.phone || '—'}</div>
        </td>
        <td>
          <div class="text-truncate" style="max-width: 220px;" title="${d.address}, ${d.city}">
            <i class="bi bi-geo-alt me-1 text-muted"></i>${d.address}, ${d.city}
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <i class="bi bi-person text-muted"></i>
            <span class="${d.driver === 'Unassigned' ? 'text-muted fst-italic' : 'text-dark fw-medium'}">${d.driver}</span>
          </div>
        </td>
        <td>
          ${getPriorityBadge(d.priority)}
        </td>
        <td class="text-secondary" style="font-size:0.8125rem;">
          ${d.displayDate || d.date}
        </td>
        <td>
          ${getStatusBadge(d.status)}
        </td>
        <td class="pe-4 text-end">
          <div class="dropdown">
            <button class="btn btn-sm btn-light border p-1 px-2 text-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size:0.75rem;">
              Actions
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size:0.8125rem;">
              <li>
                <button class="dropdown-item py-1 text-primary btn-view-delivery" type="button" data-id="${d.id}">
                  <i class="bi bi-eye me-2"></i>View Details
                </button>
              </li>
              <li>
                <a class="dropdown-item py-1 text-secondary" href="edit-delivery.html?id=${d.id}">
                  <i class="bi bi-pencil me-2"></i>Edit
                </a>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <button class="dropdown-item py-1 text-danger btn-delete-delivery" type="button" data-id="${d.id}" data-name="${d.customer}">
                  <i class="bi bi-trash me-2"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    // Attach View & Delete handlers
    tableBody.querySelectorAll('.btn-view-delivery').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openViewModal(id);
      });
    });

    tableBody.querySelectorAll('.btn-delete-delivery').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        openDeleteModal(id, name);
      });
    });
  }

  function applyFilters() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const st = statusFilter ? statusFilter.value : 'ALL';
    const drv = driverFilter ? driverFilter.value : 'ALL';
    const prio = priorityFilter ? priorityFilter.value : 'ALL';
    const dt = dateFilter ? dateFilter.value : '';

    const isFiltered = q || st !== 'ALL' || drv !== 'ALL' || prio !== 'ALL' || dt;
    if (clearFiltersBtn) {
      if (isFiltered) clearFiltersBtn.classList.remove('d-none');
      else clearFiltersBtn.classList.add('d-none');
    }

    const all = getDeliveries();
    const filtered = all.filter((d) => {
      // 1. Search Query (ID, Customer, Address, Driver)
      const matchesQ =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.driver.toLowerCase().includes(q);

      // 2. Status
      const matchesSt = st === 'ALL' || d.status.toLowerCase() === st.toLowerCase();

      // 3. Driver
      const matchesDrv = drv === 'ALL' || d.driver.toLowerCase() === drv.toLowerCase();

      // 4. Priority
      const matchesPrio = prio === 'ALL' || d.priority.toLowerCase() === prio.toLowerCase();

      // 5. Date
      const matchesDate = !dt || d.date === dt;

      return matchesQ && matchesSt && matchesDrv && matchesPrio && matchesDate;
    });

    renderTable(filtered);
  }

  // Filter Listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (driverFilter) driverFilter.addEventListener('change', applyFilters);
  if (priorityFilter) priorityFilter.addEventListener('change', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = 'ALL';
      if (driverFilter) driverFilter.value = 'ALL';
      if (priorityFilter) priorityFilter.value = 'ALL';
      if (dateFilter) dateFilter.value = '';
      applyFilters();
    });
  }

  // Empty State Reset Button
  const emptyStateReset = document.getElementById('emptyStateResetBtn');
  if (emptyStateReset) {
    emptyStateReset.addEventListener('click', () => {
      if (clearFiltersBtn) clearFiltersBtn.click();
    });
  }

  // Initial table render
  renderTable(getDeliveries());

  // Check URL query parameters for direct modal trigger (e.g., from Dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'view' && urlParams.get('id')) {
    setTimeout(() => {
      openViewModal(urlParams.get('id'));
    }, 150);
  }
}

/* ==========================================================================
   6. Step 9: Visual Delivery Status Timeline, Driver Card & Activity Log
   ========================================================================== */
function generateStatusTimelineHtml(status) {
  const isFailed = status === 'Failed';
  
  // Calculate milestone states
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
          <div class="text-muted small"><i class="bi bi-telephone me-1"></i>+91 98220 12345 &bull; <i class="bi bi-truck me-1"></i>Courier Van</div>
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

let activeViewDeliveryId = null;

function openViewModal(id) {
  const delivery = getDeliveryById(id);
  if (!delivery) return;

  activeViewDeliveryId = id;
  const modalEl = document.getElementById('viewDeliveryModal');
  if (!modalEl) return;

  // Populate basic modal data
  const setTxt = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = val || '—';
  };

  setTxt('viewModalId', delivery.id);
  setTxt('viewModalCustomer', delivery.customer);
  setTxt('viewModalPhone', delivery.phone);
  setTxt('viewModalEmail', delivery.email);
  setTxt('viewModalAddress', `${delivery.address}, ${delivery.city} – ${delivery.postalCode}`);
  setTxt('viewModalCoordinates', `${delivery.latitude}° N, ${delivery.longitude}° E`);
  setTxt('viewModalPackage', delivery.package);
  setTxt('viewModalWeight', delivery.weight);
  setTxt('viewModalDriver', delivery.driver);
  setTxt('viewModalDate', delivery.displayDate || delivery.date);
  setTxt('viewModalNotes', delivery.notes || 'No special handling instructions provided.');

  const statusWrap = document.getElementById('viewModalStatus');
  if (statusWrap) statusWrap.innerHTML = getStatusBadge(delivery.status);

  const prioWrap = document.getElementById('viewModalPriority');
  if (prioWrap) prioWrap.innerHTML = getPriorityBadge(delivery.priority);

  // Sync Quick Status Select
  const statusSelect = document.getElementById('viewModalQuickStatusSelect');
  if (statusSelect) statusSelect.value = delivery.status;

  // Wire Admin Quick Status Apply Button
  const btnApplyStatus = document.getElementById('btnAdminApplyStatus');
  if (btnApplyStatus) {
    btnApplyStatus.onclick = () => {
      const newStatus = statusSelect.value;
      const all = getDeliveries();
      const item = all.find(d => d.id === delivery.id);
      if (item) {
        item.status = newStatus;
        saveDeliveries(all);
        // Refresh view modal
        openViewModal(delivery.id);
        // Refresh deliveries table
        applyFiltersAndRender();
        if (typeof showToast === 'function') {
          showToast('Status updated successfully.', 'success');
        }
      }
    };
  }

  // 1. Status Timeline
  const timelineContainer = document.getElementById('viewModalTimelineContainer');
  if (timelineContainer) {
    timelineContainer.innerHTML = generateStatusTimelineHtml(delivery.status);
  }

  // 2. Driver Information
  const driverCard = document.getElementById('viewModalDriverCard');
  if (driverCard) {
    driverCard.innerHTML = generateDriverInfoCardHtml(delivery.driver);
  }

  // 3. Activity Log
  const activityLog = document.getElementById('viewModalActivityLog');
  if (activityLog) {
    activityLog.innerHTML = generateActivityLogHtml(delivery);
  }

  const editBtn = document.getElementById('viewModalEditLink');
  if (editBtn) editBtn.href = `edit-delivery.html?id=${delivery.id}`;

  // Show Bootstrap Modal
  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();
}

/* ==========================================================================
   7. Delete Delivery Confirmation Modal Handler
   ========================================================================== */
let pendingDeleteId = null;

function openDeleteModal(id, customerName) {
  pendingDeleteId = id;
  const modalEl = document.getElementById('deleteConfirmModal');
  const nameEl = document.getElementById('deleteModalTargetName');
  const idEl = document.getElementById('deleteModalTargetId');

  if (nameEl) nameEl.textContent = customerName || 'this recipient';
  if (idEl) idEl.textContent = id;

  if (modalEl) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
}

function initDeleteModalHandler() {
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', () => {
    if (!pendingDeleteId) return;

    // Remove from local array
    const current = getDeliveries();
    const updated = current.filter((d) => d.id !== pendingDeleteId);
    saveDeliveries(updated);

    // Hide Modal
    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl) {
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }

    // Refresh table & show toast
    const tableBody = document.getElementById('deliveriesTableBody');
    if (tableBody) {
      initDeliveriesListPage();
    }

    if (typeof showToast === 'function') {
      showToast(`Delivery #${pendingDeleteId} was successfully removed.`, 'success');
    }

    pendingDeleteId = null;
  });
}

/* ==========================================================================
   8. Add Delivery Form Handler (admin/add-delivery.html)
   ========================================================================== */
function initAddDeliveryPage() {
  const form = document.getElementById('addDeliveryForm');
  if (!form) return; // Not on add-delivery.html

  const successAlert = document.getElementById('formSuccessAlert');

  const autofillBtn = document.getElementById('btnAutofillDemoDelivery');
  if (autofillBtn) {
    autofillBtn.addEventListener('click', () => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      };
      setVal('customerName', 'Kavita Reddy');
      setVal('customerPhone', '+91 98111 22233');
      setVal('customerEmail', 'kavita.reddy@example.com');
      setVal('deliveryAddress', 'Flat 101, Senapati Bapat Road, Shivaji Nagar');
      setVal('deliveryCity', 'Pune');
      setVal('deliveryPostalCode', '411016');
      setVal('deliveryLatitude', '18.5362');
      setVal('deliveryLongitude', '73.8298');
      setVal('packageDesc', 'ThinkPad T14 Laptop & Charger');
      setVal('packageWeight', '2.2');
      setVal('packagePriority', 'High');
      setVal('assignDriver', 'Amit Patil');
      setVal('deliveryNotes', 'Urgent parcel. Security access badge verification required at gate.');

      if (typeof showToast === 'function') {
        showToast('Sample order details populated for presentation.', 'info');
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset validations
    form.classList.remove('was-validated');
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((inp) => inp.classList.remove('is-invalid'));

    // Validation checks
    let isValid = true;
    const requiredIds = [
      'customerName',
      'customerPhone',
      'customerEmail',
      'deliveryAddress',
      'deliveryCity',
      'deliveryPostalCode',
      'packageDesc',
      'packageWeight',
      'packagePriority',
      'deliveryDate',
    ];

    requiredIds.forEach((fieldId) => {
      const el = document.getElementById(fieldId);
      if (el && !el.value.trim()) {
        el.classList.add('is-invalid');
        isValid = false;
      }
    });

    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Generate New ID
    const currentList = getDeliveries();
    const maxNum = currentList.reduce((max, d) => {
      const num = parseInt(d.id.replace('SC-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 1000);
    const newId = `SC-${maxNum + 1}`;

    const dateVal = document.getElementById('deliveryDate').value;
    let formattedDate = dateVal;
    try {
      const d = new Date(dateVal);
      formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {}

    // Construct New Delivery Object
    const newDelivery = {
      id: newId,
      customer: document.getElementById('customerName').value.trim(),
      phone: document.getElementById('customerPhone').value.trim(),
      email: document.getElementById('customerEmail').value.trim(),
      address: document.getElementById('deliveryAddress').value.trim(),
      city: document.getElementById('deliveryCity').value.trim(),
      postalCode: document.getElementById('deliveryPostalCode').value.trim(),
      latitude: parseFloat(document.getElementById('deliveryLatitude').value) || 18.5204,
      longitude: parseFloat(document.getElementById('deliveryLongitude').value) || 73.8567,
      package: document.getElementById('packageDesc').value.trim(),
      weight: `${document.getElementById('packageWeight').value.trim()} kg`,
      priority: document.getElementById('packagePriority').value,
      driver: document.getElementById('assignDriver').value || 'Unassigned',
      date: dateVal,
      displayDate: formattedDate,
      status: 'Pending',
      notes: document.getElementById('deliveryNotes').value.trim() || 'No special instructions.',
    };

    // Save
    currentList.unshift(newDelivery);
    saveDeliveries(currentList);

    // Show Success Message
    if (successAlert) {
      successAlert.classList.remove('d-none');
      successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const submitBtn = document.getElementById('submitDeliveryBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Delivery Created!';
    }

    if (typeof showToast === 'function') {
      showToast('Delivery added successfully.', 'success');
    }

    // Redirect after brief delay
    setTimeout(() => {
      window.location.href = 'deliveries.html';
    }, 1200);
  });
}

/* ==========================================================================
   9. Edit Delivery Form Handler (admin/edit-delivery.html)
   ========================================================================== */
function initEditDeliveryPage() {
  const form = document.getElementById('editDeliveryForm');
  if (!form) return; // Not on edit-delivery.html

  const params = new URLSearchParams(window.location.search);
  const errorAlert = document.getElementById('editNotFoundErrorAlert');
  const successAlert = document.getElementById('formSuccessAlert');
  const titleDisplay = document.getElementById('editingDeliveryIdText');

  let targetId = params.get('id');
  if (!targetId) {
    const all = getDeliveries();
    targetId = (all && all.length > 0) ? all[0].id : 'SC-1001';
  }

  const delivery = getDeliveryById(targetId);
  if (!delivery) {
    if (errorAlert) {
      errorAlert.classList.remove('d-none');
      errorAlert.textContent = `Delivery record "${targetId}" was not found.`;
    }
    return;
  }

  if (titleDisplay) titleDisplay.textContent = `#${delivery.id}`;

  // Populate Form Inputs
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('customerName', delivery.customer);
  setVal('customerPhone', delivery.phone);
  setVal('customerEmail', delivery.email);
  setVal('deliveryAddress', delivery.address);
  setVal('deliveryCity', delivery.city);
  setVal('deliveryPostalCode', delivery.postalCode);
  setVal('deliveryLatitude', delivery.latitude);
  setVal('deliveryLongitude', delivery.longitude);
  setVal('packageDesc', delivery.package);
  setVal('packageWeight', delivery.weight ? delivery.weight.replace(' kg', '') : '');
  setVal('packagePriority', delivery.priority);
  
  const driverSelect = document.getElementById('assignDriver');
  if (driverSelect && delivery.driver) {
    const exists = Array.from(driverSelect.options).some(o => o.value === delivery.driver);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = delivery.driver;
      opt.textContent = `${delivery.driver} (Assigned Driver)`;
      driverSelect.appendChild(opt);
    }
  }
  setVal('assignDriver', delivery.driver);
  setVal('deliveryDate', delivery.date);
  setVal('deliveryStatus', delivery.status);
  setVal('deliveryNotes', delivery.notes);

  // Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((inp) => inp.classList.remove('is-invalid'));

    let isValid = true;
    const requiredIds = [
      'customerName',
      'customerPhone',
      'customerEmail',
      'deliveryAddress',
      'deliveryCity',
      'deliveryPostalCode',
      'packageDesc',
      'packageWeight',
      'packagePriority',
      'deliveryDate',
      'deliveryStatus',
    ];

    requiredIds.forEach((fieldId) => {
      const el = document.getElementById(fieldId);
      if (el && !el.value.trim()) {
        el.classList.add('is-invalid');
        isValid = false;
      }
    });

    if (!isValid) {
      const firstInvalid = form.querySelector('.is-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const dateVal = document.getElementById('deliveryDate').value;
    let formattedDate = dateVal;
    try {
      const d = new Date(dateVal);
      formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {}

    // Update Record
    const list = getDeliveries();
    const idx = list.findIndex((d) => d.id === targetId);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        customer: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.trim(),
        email: document.getElementById('customerEmail').value.trim(),
        address: document.getElementById('deliveryAddress').value.trim(),
        city: document.getElementById('deliveryCity').value.trim(),
        postalCode: document.getElementById('deliveryPostalCode').value.trim(),
        latitude: parseFloat(document.getElementById('deliveryLatitude').value) || list[idx].latitude,
        longitude: parseFloat(document.getElementById('deliveryLongitude').value) || list[idx].longitude,
        package: document.getElementById('packageDesc').value.trim(),
        weight: `${document.getElementById('packageWeight').value.trim()} kg`,
        priority: document.getElementById('packagePriority').value,
        driver: document.getElementById('assignDriver').value || 'Unassigned',
        date: dateVal,
        displayDate: formattedDate,
        status: document.getElementById('deliveryStatus').value,
        notes: document.getElementById('deliveryNotes').value.trim(),
      };
      saveDeliveries(list);
    }

    // Success State
    if (successAlert) {
      successAlert.classList.remove('d-none');
      successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const submitBtn = document.getElementById('updateDeliveryBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Changes Saved!';
    }

    if (typeof showToast === 'function') {
      showToast('Delivery updated successfully.', 'success');
    }

    // Redirect after brief delay
    setTimeout(() => {
      window.location.href = 'deliveries.html';
    }, 1200);
  });
}

/* ==========================================================================
   10. Global Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initDeliveriesListPage();
  initDeleteModalHandler();
  initAddDeliveryPage();
  initEditDeliveryPage();
});
