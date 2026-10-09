/**
 * SmartCourier – Driver Management Module (drivers.js)
 * --------------------------------------------------------------------------
 * Handles:
 * 1. Centralized driver state management (localStorage persistence with fallback)
 * 2. Summary KPI statistics calculation (Total, Available, On Delivery, Offline)
 * 3. Dynamic responsive table rendering with avatars, vehicles & status badges
 * 4. Multi-field search (Name, Phone, Email, Vehicle No, License No)
 * 5. Compound filters (Status, Vehicle Type)
 * 6. "View Driver Details" interactive Bootstrap modal
 * 7. "Add Driver" modal with validation & automatic ID generation
 * 8. "Edit Driver" modal with data pre-filling, validation & update
 * 9. "Delete Driver" confirmation modal with state removal
 * 10. API-Ready function contracts for ASP.NET Core Web API integration:
 *     GET /api/drivers, GET /api/drivers/{id}, POST /api/drivers,
 *     PUT /api/drivers/{id}, DELETE /api/drivers/{id}
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   1. API Endpoint Constants (Prepared for future ASP.NET Core Web API)
   ========================================================================== */
const DRIVER_API_ENDPOINTS = Object.freeze({
  GET_DRIVERS:   '/api/drivers',
  GET_DRIVER:    (id) => `/api/drivers/${id}`,
  CREATE_DRIVER: '/api/drivers',
  UPDATE_DRIVER: (id) => `/api/drivers/${id}`,
  DELETE_DRIVER: (id) => `/api/drivers/${id}`,
});

/* ==========================================================================
   2. Initial Realistic Demo Drivers (8 records)
   ========================================================================== */
const INITIAL_DEMO_DRIVERS = [
  {
    id: "DR-001",
    name: "Amit Patil",
    phone: "+91 98765 43210",
    email: "amit.patil@smartcourier.com",
    license: "MH12 20201234567",
    vehicleNumber: "MH12AB1234",
    vehicleType: "Bike",
    status: "Available",
    assignedDeliveries: 5,
    completedDeliveries: 42,
    zone: "Pune Central / Camp"
  },
  {
    id: "DR-002",
    name: "Rohit Jadhav",
    phone: "+91 98234 56781",
    email: "rohit.jadhav@smartcourier.com",
    license: "MH12 20199876543",
    vehicleNumber: "MH12CD5678",
    vehicleType: "Van",
    status: "On Delivery",
    assignedDeliveries: 3,
    completedDeliveries: 58,
    zone: "Alandi / North Pune"
  },
  {
    id: "DR-003",
    name: "Sahil More",
    phone: "+91 97654 32102",
    email: "sahil.more@smartcourier.com",
    license: "MH14 20215544332",
    vehicleNumber: "MH14EF9012",
    vehicleType: "Bike",
    status: "Available",
    assignedDeliveries: 4,
    completedDeliveries: 36,
    zone: "Wakad / Hinjawadi"
  },
  {
    id: "DR-004",
    name: "Aman Shinde",
    phone: "+91 91234 56783",
    email: "aman.shinde@smartcourier.com",
    license: "MH12 20181122334",
    vehicleNumber: "MH12GH3456",
    vehicleType: "Tempo",
    status: "On Delivery",
    assignedDeliveries: 6,
    completedDeliveries: 72,
    zone: "Kharadi / Hadapsar"
  },
  {
    id: "DR-005",
    name: "Karan Verma",
    phone: "+91 99887 76654",
    email: "karan.verma@smartcourier.com",
    license: "MH14 20227788990",
    vehicleNumber: "MH14IJ7890",
    vehicleType: "Truck",
    status: "Offline",
    assignedDeliveries: 0,
    completedDeliveries: 29,
    zone: "Hinjawadi Phase 2"
  },
  {
    id: "DR-006",
    name: "Santosh Gaikwad",
    phone: "+91 98760 12345",
    email: "santosh.g@smartcourier.com",
    license: "MH12 20173344556",
    vehicleNumber: "MH12KL2345",
    vehicleType: "Bike",
    status: "Available",
    assignedDeliveries: 2,
    completedDeliveries: 84,
    zone: "Hadapsar / Magarpatta"
  },
  {
    id: "DR-007",
    name: "Deepak Pawar",
    phone: "+91 97531 24686",
    email: "deepak.p@smartcourier.com",
    license: "MH14 20206677889",
    vehicleNumber: "MH14MN6789",
    vehicleType: "Van",
    status: "On Delivery",
    assignedDeliveries: 4,
    completedDeliveries: 51,
    zone: "FC Road / Shivaji Nagar"
  },
  {
    id: "DR-008",
    name: "Nilesh Shinde",
    phone: "+91 98989 89897",
    email: "nilesh.s@smartcourier.com",
    license: "MH12 20239900112",
    vehicleNumber: "MH12OP0123",
    vehicleType: "Bike",
    status: "Offline",
    assignedDeliveries: 0,
    completedDeliveries: 18,
    zone: "Baner / Kothrud"
  }
];

const DRIVERS_STORAGE_KEY = 'sc_drivers';

/* ==========================================================================
   3. Centralized State Storage Functions
   ========================================================================== */
function getDrivers() {
  try {
    const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DRIVERS));
      return INITIAL_DEMO_DRIVERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DRIVERS));
      return INITIAL_DEMO_DRIVERS;
    }
    return parsed;
  } catch (err) {
    console.warn('[SmartCourier] Drivers storage read failed:', err);
    return INITIAL_DEMO_DRIVERS;
  }
}

function saveDrivers(list) {
  try {
    localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('[SmartCourier] Drivers storage write failed:', err);
  }
}

function getDriverById(id) {
  const list = getDrivers();
  return list.find((d) => d.id === id) || null;
}

/* ==========================================================================
   4. UI Badge & Icon Formatters
   ========================================================================== */
function getDriverStatusBadge(status) {
  switch (status) {
    case 'Available':
      return '<span class="status-badge status-badge-success"><i class="bi bi-check-circle me-1"></i>Available</span>';
    case 'On Delivery':
      return '<span class="status-badge status-badge-primary"><i class="bi bi-truck me-1"></i>On Delivery</span>';
    case 'Offline':
      return '<span class="status-badge status-badge-secondary"><i class="bi bi-slash-circle me-1"></i>Offline</span>';
    default:
      return `<span class="status-badge status-badge-secondary">${status}</span>`;
  }
}

function getVehicleTypeBadge(type) {
  let icon = 'bi-bicycle';
  let color = 'primary';
  if (type === 'Van')   { icon = 'bi-truck-flatbed'; color = 'info'; }
  if (type === 'Truck') { icon = 'bi-truck';         color = 'danger'; }
  if (type === 'Tempo') { icon = 'bi-box-seam';      color = 'warning'; }

  return `<span class="badge bg-light text-dark border px-2 py-1 fw-medium"><i class="bi ${icon} me-1 text-${color}"></i>${type}</span>`;
}

function getDriverInitials(name) {
  if (!name) return 'DR';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

/* ==========================================================================
   5. Driver KPI Summary Statistics Calculation
   ========================================================================== */
function updateDriverSummaryCards(list) {
  const currentList = list || getDrivers();

  const totalEl     = document.getElementById('statTotalDrivers');
  const availableEl = document.getElementById('statAvailableDrivers');
  const onDelEl     = document.getElementById('statOnDeliveryDrivers');
  const offlineEl   = document.getElementById('statOfflineDrivers');

  const total      = currentList.length;
  const available  = currentList.filter((d) => d.status === 'Available').length;
  const onDelivery = currentList.filter((d) => d.status === 'On Delivery').length;
  const offline    = currentList.filter((d) => d.status === 'Offline').length;

  if (totalEl)     totalEl.textContent     = total;
  if (availableEl) availableEl.textContent = available;
  if (onDelEl)     onDelEl.textContent     = onDelivery;
  if (offlineEl)   offlineEl.textContent   = offline;
}

/* ==========================================================================
   6. Table Rendering & Dynamic Filter Engine
   ========================================================================== */
function initDriversListPage() {
  const tableBody = document.getElementById('driversTableBody');
  const table = document.getElementById('driversTable');
  const emptyState = document.getElementById('driversEmptyState');
  const searchInput = document.getElementById('driverSearchInput');
  const statusFilter = document.getElementById('filterDriverStatus');
  const vehicleFilter = document.getElementById('filterDriverVehicle');
  const clearFiltersBtn = document.getElementById('clearDriverFiltersBtn');
  const countBadge = document.getElementById('driversCountBadge');

  if (!tableBody) return; // Not on drivers.html

  function renderTable(list) {
    if (!list || list.length === 0) {
      tableBody.innerHTML = '';
      if (table) table.classList.add('d-none');
      if (emptyState) emptyState.classList.remove('d-none');
      if (countBadge) countBadge.textContent = '0 drivers';
      return;
    }

    if (table) table.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');
    if (countBadge) countBadge.textContent = `${list.length} of ${getDrivers().length} drivers`;

    tableBody.innerHTML = list
      .map(
        (d) => `
      <tr>
        <td class="ps-4">
          <span class="fw-semibold text-primary font-monospace">${d.id}</span>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="user-avatar" style="width:34px;height:34px;font-size:0.75rem;background-color:var(--color-primary-light);color:var(--color-primary);">
              ${getDriverInitials(d.name)}
            </div>
            <div>
              <div class="fw-semibold text-dark">${d.name}</div>
              <div class="text-muted" style="font-size:0.75rem;">${d.email}</div>
            </div>
          </div>
        </td>
        <td class="text-secondary font-monospace" style="font-size:0.8125rem;">
          <i class="bi bi-telephone me-1 text-muted"></i>${d.phone}
        </td>
        <td>
          ${getVehicleTypeBadge(d.vehicleType)}
        </td>
        <td class="font-monospace text-secondary fw-medium" style="font-size:0.8125rem;">
          ${d.vehicleNumber}
        </td>
        <td>
          ${getDriverStatusBadge(d.status)}
        </td>
        <td>
          <span class="badge ${d.assignedDeliveries > 0 ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-muted border'} px-2 py-1 fw-semibold">
            ${d.assignedDeliveries} active
          </span>
        </td>
        <td class="pe-4 text-end">
          <div class="dropdown">
            <button class="btn btn-sm btn-light border p-1 px-2 text-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size:0.75rem;">
              Actions
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size:0.8125rem;">
              <li>
                <button class="dropdown-item py-1 text-primary btn-view-driver" type="button" data-id="${d.id}">
                  <i class="bi bi-eye me-2"></i>View Profile
                </button>
              </li>
              <li>
                <button class="dropdown-item py-1 text-secondary btn-edit-driver" type="button" data-id="${d.id}">
                  <i class="bi bi-pencil me-2"></i>Edit Driver
                </button>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <button class="dropdown-item py-1 text-danger btn-delete-driver" type="button" data-id="${d.id}" data-name="${d.name}">
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

    // Attach Action Listeners
    tableBody.querySelectorAll('.btn-view-driver').forEach((btn) => {
      btn.addEventListener('click', () => {
        openViewDriverModal(btn.getAttribute('data-id'));
      });
    });

    tableBody.querySelectorAll('.btn-edit-driver').forEach((btn) => {
      btn.addEventListener('click', () => {
        openEditDriverModal(btn.getAttribute('data-id'));
      });
    });

    tableBody.querySelectorAll('.btn-delete-driver').forEach((btn) => {
      btn.addEventListener('click', () => {
        openDeleteDriverModal(btn.getAttribute('data-id'), btn.getAttribute('data-name'));
      });
    });
  }

  function applyFilters() {
    const q  = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const st = statusFilter ? statusFilter.value : 'ALL';
    const vt = vehicleFilter ? vehicleFilter.value : 'ALL';

    const isFiltered = q || st !== 'ALL' || vt !== 'ALL';
    if (clearFiltersBtn) {
      if (isFiltered) clearFiltersBtn.classList.remove('d-none');
      else clearFiltersBtn.classList.add('d-none');
    }

    const all = getDrivers();
    const filtered = all.filter((d) => {
      // 1. Search Query (Name, Phone, Email, Vehicle Number, License Number)
      const matchesQ =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.vehicleNumber.toLowerCase().includes(q) ||
        d.license.toLowerCase().includes(q);

      // 2. Status Match
      const matchesSt = st === 'ALL' || d.status.toLowerCase() === st.toLowerCase();

      // 3. Vehicle Type Match
      const matchesVt = vt === 'ALL' || d.vehicleType.toLowerCase() === vt.toLowerCase();

      return matchesQ && matchesSt && matchesVt;
    });

    renderTable(filtered);
  }

  // Event Listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (vehicleFilter) vehicleFilter.addEventListener('change', applyFilters);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = 'ALL';
      if (vehicleFilter) vehicleFilter.value = 'ALL';
      applyFilters();
    });
  }

  const emptyResetBtn = document.getElementById('emptyStateDriverResetBtn');
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      if (clearFiltersBtn) clearFiltersBtn.click();
    });
  }

  // Initial Load
  updateDriverSummaryCards();
  renderTable(getDrivers());
}

/* ==========================================================================
   7. View Driver Modal Controller
   ========================================================================== */
function openViewDriverModal(id) {
  const driver = getDriverById(id);
  if (!driver) return;

  const modalEl = document.getElementById('viewDriverModal');
  if (!modalEl) return;

  const setTxt = (elId, val) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = val !== undefined && val !== null ? val : '—';
  };

  setTxt('viewDriverModalId', driver.id);
  setTxt('viewDriverModalName', driver.name);
  setTxt('viewDriverModalPhone', driver.phone);
  setTxt('viewDriverModalEmail', driver.email);
  setTxt('viewDriverModalLicense', driver.license);
  setTxt('viewDriverModalVehicleNumber', driver.vehicleNumber);
  setTxt('viewDriverModalZone', driver.zone || 'Pune City');
  setTxt('viewDriverModalActiveDeliveries', `${driver.assignedDeliveries} Active Orders`);
  setTxt('viewDriverModalCompletedDeliveries', `${driver.completedDeliveries} Orders Completed`);

  const avatarBox = document.getElementById('viewDriverModalAvatar');
  if (avatarBox) avatarBox.textContent = getDriverInitials(driver.name);

  const statusBox = document.getElementById('viewDriverModalStatus');
  if (statusBox) statusBox.innerHTML = getDriverStatusBadge(driver.status);

  const vehicleBox = document.getElementById('viewDriverModalVehicle');
  if (vehicleBox) vehicleBox.innerHTML = getVehicleTypeBadge(driver.vehicleType);

  const editBtn = document.getElementById('viewDriverModalEditBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      const bsViewModal = bootstrap.Modal.getInstance(modalEl);
      if (bsViewModal) bsViewModal.hide();
      openEditDriverModal(driver.id);
    };
  }

  const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
  bsModal.show();
}

/* ==========================================================================
   8. Add Driver Modal Controller
   ========================================================================== */
function initAddDriverModal() {
  const form = document.getElementById('addDriverForm');
  const modalEl = document.getElementById('addDriverModal');
  if (!form || !modalEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((inp) => inp.classList.remove('is-invalid'));

    let isValid = true;
    const requiredIds = [
      'addDriverName',
      'addDriverPhone',
      'addDriverEmail',
      'addDriverLicense',
      'addDriverVehicleNumber',
      'addDriverVehicleType',
      'addDriverStatus',
    ];

    requiredIds.forEach((id) => {
      const el = document.getElementById(id);
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

    // Generate New Driver ID (e.g. DR-009)
    const list = getDrivers();
    const maxNum = list.reduce((max, d) => {
      const num = parseInt(d.id.replace('DR-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `DR-${String(maxNum + 1).padStart(3, '0')}`;

    const newDriver = {
      id: newId,
      name: document.getElementById('addDriverName').value.trim(),
      phone: document.getElementById('addDriverPhone').value.trim(),
      email: document.getElementById('addDriverEmail').value.trim(),
      license: document.getElementById('addDriverLicense').value.trim(),
      vehicleNumber: document.getElementById('addDriverVehicleNumber').value.trim().toUpperCase(),
      vehicleType: document.getElementById('addDriverVehicleType').value,
      status: document.getElementById('addDriverStatus').value,
      assignedDeliveries: 0,
      completedDeliveries: 0,
      zone: document.getElementById('addDriverZone').value.trim() || 'Pune City Fleet'
    };

    list.unshift(newDriver);
    saveDrivers(list);

    // Close Modal & Reset Form
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();
    form.reset();

    // Refresh UI
    updateDriverSummaryCards();
    initDriversListPage();

    if (typeof showToast === 'function') {
      showToast('Driver added successfully.', 'success');
    }
  });
}

/* ==========================================================================
   9. Edit Driver Modal Controller
   ========================================================================== */
let editingDriverId = null;

function openEditDriverModal(id) {
  const driver = getDriverById(id);
  if (!driver) return;

  editingDriverId = id;
  const modalEl = document.getElementById('editDriverModal');
  const titleDisplay = document.getElementById('editDriverModalIdTitle');

  if (titleDisplay) titleDisplay.textContent = `#${driver.id}`;

  const setVal = (elId, val) => {
    const el = document.getElementById(elId);
    if (el && val !== undefined) el.value = val;
  };

  setVal('editDriverName', driver.name);
  setVal('editDriverPhone', driver.phone);
  setVal('editDriverEmail', driver.email);
  setVal('editDriverLicense', driver.license);
  setVal('editDriverVehicleNumber', driver.vehicleNumber);
  setVal('editDriverVehicleType', driver.vehicleType);
  setVal('editDriverStatus', driver.status);
  setVal('editDriverZone', driver.zone || 'Pune City');

  if (modalEl) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
}

function initEditDriverModal() {
  const form = document.getElementById('editDriverForm');
  const modalEl = document.getElementById('editDriverModal');
  if (!form || !modalEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!editingDriverId) return;

    // Validation
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((inp) => inp.classList.remove('is-invalid'));

    let isValid = true;
    const requiredIds = [
      'editDriverName',
      'editDriverPhone',
      'editDriverEmail',
      'editDriverLicense',
      'editDriverVehicleNumber',
      'editDriverVehicleType',
      'editDriverStatus',
    ];

    requiredIds.forEach((id) => {
      const el = document.getElementById(id);
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

    // Update List
    const list = getDrivers();
    const idx = list.findIndex((d) => d.id === editingDriverId);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        name: document.getElementById('editDriverName').value.trim(),
        phone: document.getElementById('editDriverPhone').value.trim(),
        email: document.getElementById('editDriverEmail').value.trim(),
        license: document.getElementById('editDriverLicense').value.trim(),
        vehicleNumber: document.getElementById('editDriverVehicleNumber').value.trim().toUpperCase(),
        vehicleType: document.getElementById('editDriverVehicleType').value,
        status: document.getElementById('editDriverStatus').value,
        zone: document.getElementById('editDriverZone').value.trim() || list[idx].zone,
      };
      saveDrivers(list);
    }

    // Close Modal
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    // Refresh UI
    updateDriverSummaryCards();
    initDriversListPage();

    if (typeof showToast === 'function') {
      showToast('Driver updated successfully.', 'success');
    }

    editingDriverId = null;
  });
}

/* ==========================================================================
   10. Delete Driver Confirmation Modal Controller
   ========================================================================== */
let pendingDeleteDriverId = null;

function openDeleteDriverModal(id, name) {
  pendingDeleteDriverId = id;
  const modalEl = document.getElementById('deleteDriverConfirmModal');
  const idEl = document.getElementById('deleteDriverModalIdText');
  const nameEl = document.getElementById('deleteDriverModalNameText');

  if (idEl) idEl.textContent = id;
  if (nameEl) nameEl.textContent = name || 'this driver';

  if (modalEl) {
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
  }
}

function initDeleteDriverModal() {
  const confirmBtn = document.getElementById('confirmDeleteDriverBtn');
  const modalEl = document.getElementById('deleteDriverConfirmModal');
  if (!confirmBtn || !modalEl) return;

  confirmBtn.addEventListener('click', () => {
    if (!pendingDeleteDriverId) return;

    const list = getDrivers();
    const updated = list.filter((d) => d.id !== pendingDeleteDriverId);
    saveDrivers(updated);

    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();

    // Refresh UI
    updateDriverSummaryCards();
    initDriversListPage();

    if (typeof showToast === 'function') {
      showToast(`Driver #${pendingDeleteDriverId} has been removed from the fleet.`, 'success');
    }

    pendingDeleteDriverId = null;
  });
}

/* ==========================================================================
   11. Global Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initDriversListPage();
  initAddDriverModal();
  initEditDriverModal();
  initDeleteDriverModal();
});
