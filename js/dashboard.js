/**
 * SmartCourier – Admin Dashboard JavaScript (dashboard.js)
 * --------------------------------------------------------------------------
 * STEP 4A & STEP 4B: Dashboard State & Dynamic Rendering
 * --------------------------------------------------------------------------
 * Handles:
 * 1. Statistics Cards Data & Dynamic Rendering (Step 4A)
 * 2. Welcome Greeting Banner (Step 4A)
 * 3. Recent Deliveries Data Object & Dynamic Table Rendering (Step 4B)
 * 4. Combined Frontend Search & Status Filtering (Step 4B)
 * 5. Clean Empty State Feedback (Step 4B)
 * --------------------------------------------------------------------------
 * NOTE: Both `dashboardStats` and `recentDeliveries` are isolated data
 * structures ready to be directly connected to future ASP.NET Core Web API
 * endpoints:
 *   - GET /api/dashboard/statistics
 *   - GET /api/deliveries
 * --------------------------------------------------------------------------
 */

'use strict';

/* ==========================================================================
   1. Dashboard Statistics Data Object (Step 4A)
   ========================================================================== */
const dashboardStats = {
  totalDeliveries: 128,
  pending: 32,
  inTransit: 18,
  delivered: 78,
};

/* ==========================================================================
   2. Recent Deliveries Demo Data Array (Step 4B)
   ========================================================================== */
const recentDeliveries = [
  {
    id: "SC-1001",
    customer: "Rahul Sharma",
    address: "Pune, Maharashtra",
    driver: "Amit Patil",
    date: "08 Oct 2026",
    priority: "High",
    status: "In Transit",
  },
  {
    id: "SC-1002",
    customer: "Priya Deshmukh",
    address: "Alandi, Pune",
    driver: "Rohit Jadhav",
    date: "08 Oct 2026",
    priority: "Normal",
    status: "Pending",
  },
  {
    id: "SC-1003",
    customer: "Aditya Kulkarni",
    address: "Wakad, Pune",
    driver: "Sahil More",
    date: "08 Oct 2026",
    priority: "High",
    status: "Delivered",
  },
  {
    id: "SC-1004",
    customer: "Sneha Joshi",
    address: "Kharadi, Pune",
    driver: "Aman Shinde",
    date: "08 Oct 2026",
    priority: "Normal",
    status: "Assigned",
  },
  {
    id: "SC-1005",
    customer: "Vikram Patil",
    address: "Hinjawadi, Pune",
    driver: "Karan Verma",
    date: "08 Oct 2026",
    priority: "Normal",
    status: "Failed",
  },
];

/* ==========================================================================
   3. Statistics & Welcome Header Functions (Step 4A & Step 9 Sync)
   ========================================================================== */
function getLiveDashboardStats() {
  try {
    const raw = localStorage.getItem('sc_deliveries');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return {
          totalDeliveries: list.length,
          pending: list.filter((d) => d.status === 'Pending' || d.status === 'Assigned').length,
          inTransit: list.filter((d) => d.status === 'In Transit' || d.status === 'Out for Delivery').length,
          delivered: list.filter((d) => d.status === 'Delivered').length,
        };
      }
    }
  } catch (_) {}
  return dashboardStats;
}

function renderDashboardStats(stats) {
  const currentStats = stats || getLiveDashboardStats();

  const totalEl     = document.getElementById('statTotalDeliveries');
  const pendingEl   = document.getElementById('statPending');
  const inTransitEl = document.getElementById('statInTransit');
  const deliveredEl = document.getElementById('statDelivered');

  if (totalEl)     totalEl.textContent     = Number(currentStats.totalDeliveries).toLocaleString();
  if (pendingEl)   pendingEl.textContent   = Number(currentStats.pending).toLocaleString();
  if (inTransitEl) inTransitEl.textContent = Number(currentStats.inTransit).toLocaleString();
  if (deliveredEl) deliveredEl.textContent = Number(currentStats.delivered).toLocaleString();
}

function renderWelcomeGreeting() {
  const welcomeTitleEl = document.getElementById('welcomeGreetingTitle');
  if (!welcomeTitleEl) return;

  const hour = new Date().getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17) {
    timeOfDay = 'evening';
  }

  let userName = 'Admin';
  try {
    const sessionUser = JSON.parse(localStorage.getItem('sc_user'));
    if (sessionUser && sessionUser.name) {
      userName = sessionUser.name.split(' ')[0];
    }
  } catch (_) {}

  welcomeTitleEl.textContent = `Good ${timeOfDay}, ${userName}!`;
}

/* ==========================================================================
   4. Recent Deliveries Rendering & Filtering (Step 4B)
   ========================================================================== */

/**
 * Returns HTML for the appropriate status badge
 */
function getStatusBadgeHtml(status) {
  switch (status) {
    case 'Pending':
      return '<span class="status-badge status-badge-warning">Pending</span>';
    case 'Assigned':
      return '<span class="status-badge status-badge-info">Assigned</span>';
    case 'In Transit':
      return '<span class="status-badge status-badge-primary">In Transit</span>';
    case 'Delivered':
      return '<span class="status-badge status-badge-success">Delivered</span>';
    case 'Failed':
      return '<span class="status-badge status-badge-danger">Failed</span>';
    default:
      return `<span class="status-badge status-badge-secondary">${status}</span>`;
  }
}

/**
 * Returns HTML for priority badge
 */
function getPriorityBadgeHtml(priority) {
  if (priority === 'High') {
    return '<span class="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold" style="font-size:0.7rem; padding:0.25rem 0.5rem;">High</span>';
  }
  return '<span class="badge bg-light text-secondary border fw-medium" style="font-size:0.7rem; padding:0.25rem 0.5rem;">Normal</span>';
}

/**
 * Renders an array of delivery objects into the table body
 */
function renderDeliveriesTable(deliveries) {
  const tbody = document.getElementById('recentDeliveriesTableBody');
  const table = document.getElementById('recentDeliveriesTable');
  const emptyState = document.getElementById('deliveryEmptyState');
  const resultsCountEl = document.getElementById('deliveryResultsCount');
  const summaryTextEl = document.getElementById('tableSummaryText');

  if (!tbody || !emptyState) return;

  // Handle empty state
  if (!deliveries || deliveries.length === 0) {
    tbody.innerHTML = '';
    if (table) table.classList.add('d-none');
    emptyState.classList.remove('d-none');
    if (resultsCountEl) resultsCountEl.textContent = 'Showing 0 deliveries';
    if (summaryTextEl) summaryTextEl.textContent = 'No matching records';
    return;
  }

  // Restore table display
  if (table) table.classList.remove('d-none');
  emptyState.classList.add('d-none');

  if (resultsCountEl) {
    resultsCountEl.textContent = `Showing ${deliveries.length} of ${recentDeliveries.length} deliveries`;
  }
  if (summaryTextEl) {
    summaryTextEl.textContent = `Displaying ${deliveries.length} recent delivery record${deliveries.length > 1 ? 's' : ''}`;
  }

  // Generate table rows dynamically
  tbody.innerHTML = deliveries
    .map(
      (delivery) => `
    <tr>
      <!-- Delivery ID -->
      <td class="ps-4">
        <span class="fw-semibold text-primary font-monospace">${delivery.id}</span>
      </td>

      <!-- Customer -->
      <td>
        <span class="fw-semibold text-dark">${delivery.customer}</span>
      </td>

      <!-- Address -->
      <td>
        <div class="text-truncate text-secondary" style="max-width: 220px;" title="${delivery.address}">
          <i class="bi bi-geo-alt me-1 text-muted"></i>${delivery.address}
        </div>
      </td>

      <!-- Driver -->
      <td>
        <div class="d-flex align-items-center gap-1">
          <i class="bi bi-person text-muted"></i>
          <span class="${delivery.driver === 'Unassigned' ? 'text-muted fst-italic' : 'text-dark'}">${delivery.driver}</span>
        </div>
      </td>

      <!-- Date -->
      <td class="text-secondary" style="font-size:0.8125rem;">
        ${delivery.date}
      </td>

      <!-- Priority -->
      <td>
        ${getPriorityBadgeHtml(delivery.priority)}
      </td>

      <!-- Status -->
      <td>
        ${getStatusBadgeHtml(delivery.status)}
      </td>

      <!-- Action -->
      <td class="pe-4 text-end">
        <div class="dropdown">
          <button class="btn btn-sm btn-light border p-1 px-2 text-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size:0.75rem;">
            Actions
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size:0.8125rem;">
            <li>
              <a class="dropdown-item py-1" href="deliveries.html?id=${delivery.id}&action=view">
                <i class="bi bi-eye me-2 text-primary"></i>View
              </a>
            </li>
            <li>
              <a class="dropdown-item py-1" href="edit-delivery.html?id=${delivery.id}">
                <i class="bi bi-pencil me-2 text-muted"></i>Edit
              </a>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

/**
 * Filters the recentDeliveries array based on search input and status dropdown
 */
function applyDeliveryFilters() {
  const searchInput = document.getElementById('deliverySearchInput');
  const statusFilter = document.getElementById('deliveryStatusFilter');
  const resetBtn = document.getElementById('deliveryFilterResetBtn');

  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

  // Check if any filter is active
  const isFilteringActive = searchQuery !== '' || selectedStatus !== 'ALL';
  if (resetBtn) {
    if (isFilteringActive) {
      resetBtn.classList.remove('d-none');
    } else {
      resetBtn.classList.add('d-none');
    }
  }

  // Combined search & status filtering
  const filtered = recentDeliveries.filter((delivery) => {
    // 1. Search Query Match (matches ID, Customer, Address, or Driver)
    const matchesSearch =
      !searchQuery ||
      delivery.id.toLowerCase().includes(searchQuery) ||
      delivery.customer.toLowerCase().includes(searchQuery) ||
      delivery.address.toLowerCase().includes(searchQuery) ||
      delivery.driver.toLowerCase().includes(searchQuery);

    // 2. Status Match
    const matchesStatus =
      selectedStatus === 'ALL' ||
      delivery.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  renderDeliveriesTable(filtered);
}

/**
 * Initializes filter inputs and event listeners
 */
function initDeliveryFilterListeners() {
  const searchInput = document.getElementById('deliverySearchInput');
  const statusFilter = document.getElementById('deliveryStatusFilter');
  const resetBtn = document.getElementById('deliveryFilterResetBtn');
  const emptyStateResetBtn = document.getElementById('emptyStateResetBtn');

  if (searchInput) {
    searchInput.addEventListener('input', applyDeliveryFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', applyDeliveryFilters);
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'ALL';
    applyDeliveryFilters();
    if (searchInput) searchInput.focus();
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAllFilters);
  }

  if (emptyStateResetBtn) {
    emptyStateResetBtn.addEventListener('click', resetAllFilters);
  }
}

/* ==========================================================================
   5. Document Ready Initialization
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Step 4A
  renderWelcomeGreeting();
  renderDashboardStats(dashboardStats);

  // Step 4B
  initDeliveryFilterListeners();
  renderDeliveriesTable(recentDeliveries);
});
