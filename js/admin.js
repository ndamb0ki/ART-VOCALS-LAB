// Ndambuki Art Lab — Admin Dashboard

let commissionRequests = [];
let artworkOrders = [];

// ------------------------------------
// Start dashboard
// ------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  setupLoginInterface();

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  await checkAdminAccess(session.user);
});


// ------------------------------------
// Check that the logged-in user is admin
// ------------------------------------

async function checkAdminAccess(user) {
  try {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile error:", error);
      showError("Could not verify your admin account.");
      return;
    }

    if (!profile || profile.role !== "admin") {
      showError("Access denied. This account is not an administrator.");
      await supabaseClient.auth.signOut();
      showLogin();
      return;
    }

    console.log("Admin access confirmed.");

    hideLogin();

    await loadCommissionRequests();
    await loadOrders();

  } catch (error) {
    console.error(error);
    showError("Something went wrong while checking admin access.");
  }
}


// ------------------------------------
// Login interface
// ------------------------------------

function setupLoginInterface() {
  const container = document.querySelector(".container");

  if (!container) return;

  container.style.display = "none";

  const loginBox = document.createElement("div");

  loginBox.id = "loginBox";

  loginBox.style.cssText = `
    max-width: 450px;
    margin: 80px auto;
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 2px 15px rgba(0,0,0,.08);
  `;

  loginBox.innerHTML = `
    <h2 style="margin-top:0;">Admin Login</h2>

    <p style="color:#666;">
      Log in with your Ndambuki Art Lab administrator account.
    </p>

    <form id="adminLoginForm">

      <input
        type="email"
        id="adminEmail"
        placeholder="Email address"
        required
        style="
          width:100%;
          padding:12px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:6px;
        "
      >

      <input
        type="password"
        id="adminPassword"
        placeholder="Password"
        required
        style="
          width:100%;
          padding:12px;
          margin:8px 0;
          border:1px solid #ddd;
          border-radius:6px;
        "
      >

      <button
        type="submit"
        style="
          width:100%;
          padding:12px;
          margin-top:10px;
          background:#071a33;
          color:white;
          border:0;
          border-radius:6px;
          cursor:pointer;
        "
      >
        Log In
      </button>

      <p
        id="loginError"
        style="color:#b00020; margin-top:15px;"
      ></p>

    </form>
  `;

  document.body.insertBefore(loginBox, container);

  const form = document.getElementById("adminLoginForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document
      .getElementById("adminEmail")
      .value
      .trim();

    const password = document
      .getElementById("adminPassword")
      .value;

    const loginError = document.getElementById("loginError");

    loginError.textContent = "Logging in...";

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("Login error:", error);

      loginError.textContent =
        "Login failed: " + error.message;

      return;
    }

    loginError.textContent = "";

    await checkAdminAccess(data.user);
  });
}


// ------------------------------------
// Show login
// ------------------------------------

function showLogin() {
  const loginBox = document.getElementById("loginBox");
  const container = document.querySelector(".container");

  if (loginBox) {
    loginBox.style.display = "block";
  }

  if (container) {
    container.style.display = "none";
  }
}


// ------------------------------------
// Hide login
// ------------------------------------

function hideLogin() {
  const loginBox = document.getElementById("loginBox");
  const container = document.querySelector(".container");

  if (loginBox) {
    loginBox.style.display = "none";
  }

  if (container) {
    container.style.display = "block";
  }
}


// ====================================
// COMMISSION REQUESTS
// ====================================

// ------------------------------------
// Load commission requests
// ------------------------------------

async function loadCommissionRequests() {

  const loading = document.getElementById("loading");

  if (loading) {
    loading.style.display = "block";
  }

  const { data, error } = await supabaseClient
    .from("commission_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Commission loading error:", error);

    showError(
      "Could not load commission requests: " +
      error.message
    );

    if (loading) {
      loading.style.display = "none";
    }

    return;
  }

  commissionRequests = data || [];

  updateStatistics();
  renderRequests();

  if (loading) {
    loading.style.display = "none";
  }
}


// ------------------------------------
// Dashboard statistics
// ------------------------------------

function updateStatistics() {

  const total = commissionRequests.length;

  const newRequests = commissionRequests.filter(
    request => request.status === "new"
  ).length;

  const inProgress = commissionRequests.filter(
    request =>
      request.status === "in_progress" ||
      request.status === "in progress"
  ).length;

  const completed = commissionRequests.filter(
    request => request.status === "completed"
  ).length;

  const totalElement =
    document.getElementById("totalRequests");

  const newElement =
    document.getElementById("newRequests");

  const progressElement =
    document.getElementById("progressRequests");

  const completedElement =
    document.getElementById("completedRequests");

  if (totalElement) {
    totalElement.textContent = total;
  }

  if (newElement) {
    newElement.textContent = newRequests;
  }

  if (progressElement) {
    progressElement.textContent = inProgress;
  }

  if (completedElement) {
    completedElement.textContent = completed;
  }
}


// ------------------------------------
// Render requests
// ------------------------------------

function renderRequests() {

  const table = document.getElementById("requestsTable");
  const body = document.getElementById("requestsBody");
  const emptyState = document.getElementById("emptyState");

  if (!body || !table || !emptyState) return;

  body.innerHTML = "";

  if (commissionRequests.length === 0) {

    table.style.display = "none";
    emptyState.style.display = "block";

    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  commissionRequests.forEach(request => {

    const row = document.createElement("tr");

    const date = request.created_at
      ? new Date(request.created_at).toLocaleDateString()
      : "—";

    const budget =
      request.budget !== null &&
      request.budget !== undefined
        ? `${request.currency || "KES"} ${Number(
            request.budget
          ).toLocaleString()}`
        : "—";

    const status = request.status || "new";

    const statusClass = status
      .toLowerCase()
      .replace(/\s+/g, "-");

    row.innerHTML = `
      <td>${escapeHTML(date)}</td>

      <td>
        <strong>${escapeHTML(request.name || "Unknown")}</strong>
        <br>
        <small>${escapeHTML(request.email || "")}</small>
      </td>

      <td>
        ${escapeHTML(request.artwork_type || "—")}
        <br>
        <small>${escapeHTML(request.size || "")}</small>
      </td>

      <td>${escapeHTML(budget)}</td>

      <td>${escapeHTML(request.deadline || "—")}</td>

      <td>
        <span class="status status-${statusClass}">
          ${escapeHTML(status)}
        </span>
      </td>

      <td>
        <button
          class="view-btn"
          onclick="viewCommission('${request.id}')"
        >
          View
        </button>
      </td>
    `;

    body.appendChild(row);
  });
}


// ------------------------------------
// View commission
// ------------------------------------

function viewCommission(id) {

  const request = commissionRequests.find(
    item => item.id === id
  );

  if (!request) return;

  const details = `
COMMISSION REQUEST

Customer:
${request.name || "—"}

Email:
${request.email || "—"}

Phone:
${request.phone || "—"}

Country:
${request.customer_country || "—"}

Artwork:
${request.artwork_type || "—"}

Size:
${request.size || "—"}

Orientation:
${request.orientation || "—"}

Style:
${request.style || "—"}

Background:
${request.background || "—"}

Subjects:
${request.subjects || "—"}

Colour:
${request.colour_style || "—"}

Budget:
${request.currency || "KES"} ${request.budget || "—"}

Estimated Price:
${request.estimated_price || "—"}

Delivery:
${request.delivery || "—"}

Deadline:
${request.deadline || "—"}

Reference Images:
${request.reference_image_names || "—"}

Description:
${request.description || "—"}

Status:
${request.status || "new"}

Admin Notes:
${request.admin_notes || "—"}
`;

  alert(details);
}


// ====================================
// ARTWORK ORDERS
// ====================================

// ------------------------------------
// Load orders
// ------------------------------------

async function loadOrders() {

  const loading =
    document.getElementById("ordersLoading");

  const table =
    document.getElementById("ordersTable");

  const emptyState =
    document.getElementById("ordersEmptyState");

  const body =
    document.getElementById("ordersBody");

  if (loading) {
    loading.style.display = "block";
  }

  if (table) {
    table.style.display = "none";
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }

  if (!body) return;

  body.innerHTML = "";

  const {
    data: orders,
    error: ordersError
  } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (ordersError) {

    console.error(
      "Orders loading error:",
      ordersError
    );

    if (loading) {
      loading.style.display = "none";
    }

    showError(
      "Could not load artwork orders: " +
      ordersError.message
    );

    return;
  }

  artworkOrders = orders || [];

  if (artworkOrders.length === 0) {

    if (loading) {
      loading.style.display = "none";
    }

    if (emptyState) {
      emptyState.style.display = "block";
    }

    return;
  }

  const orderIds =
    artworkOrders.map(order => order.id);

  const {
    data: items,
    error: itemsError
  } = await supabaseClient
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  if (itemsError) {

    console.error(
      "Order items loading error:",
      itemsError
    );

    if (loading) {
      loading.style.display = "none";
    }

    showError(
      "Orders loaded, but order items could not be loaded: " +
      itemsError.message
    );

    return;
  }

  const orderItems = items || [];

  artworkOrders =
    artworkOrders.map(order => {

      const itemsForOrder =
        orderItems.filter(
          item => item.order_id === order.id
        );

      return {
        ...order,
        items: itemsForOrder
      };

    });

  renderOrders();

  if (loading) {
    loading.style.display = "none";
  }
}


// ------------------------------------
// Render orders
// ------------------------------------

function renderOrders() {

  const table =
    document.getElementById("ordersTable");

  const body =
    document.getElementById("ordersBody");

  const emptyState =
    document.getElementById("ordersEmptyState");

  if (!table || !body || !emptyState) {
    return;
  }

  body.innerHTML = "";

  if (artworkOrders.length === 0) {

    table.style.display = "none";
    emptyState.style.display = "block";

    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  artworkOrders.forEach(order => {

    const row =
      document.createElement("tr");

    const date =
      order.created_at
        ? new Date(
            order.created_at
          ).toLocaleDateString()
        : "—";

    const items =
      order.items || [];

    const itemCount =
      items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );

    const itemNames =
      items.length
        ? items
            .map(
              item =>
                `${escapeHTML(item.title_snapshot || "Artwork")} × ${item.quantity}`
            )
            .join("<br>")
        : "No items";

    const total =
      `${order.currency || "KES"} ${Number(
        order.total || 0
      ).toLocaleString()}`;

    const paymentStatus =
      order.payment_status || "pending";

    const orderStatus =
      order.order_status || "pending";

    const paymentClass =
      paymentStatus
        .toLowerCase()
        .replace(/\s+/g, "-");

    const orderStatusClass =
      orderStatus
        .toLowerCase()
        .replace(/\s+/g, "-");

    row.innerHTML = `
      <td>
        ${escapeHTML(date)}
      </td>

      <td>
        <strong>
          ${escapeHTML(
            order.order_number || "—"
          )}
        </strong>
      </td>

      <td>
        <strong>
          ${escapeHTML(
            order.customer_name || "Unknown"
          )}
        </strong>

        <br>

        <small>
          ${escapeHTML(
            order.customer_email || ""
          )}
        </small>

        <br>

        <small>
          ${escapeHTML(
            order.customer_phone || ""
          )}
        </small>
      </td>

      <td>
        <div class="order-items">
          ${itemNames}
        </div>

        <small>
          ${itemCount} item${itemCount === 1 ? "" : "s"}
        </small>
      </td>

      <td>
        <span class="order-total">
          ${escapeHTML(total)}
        </span>
      </td>

      <td>
        <span class="status status-${paymentClass}">
          ${escapeHTML(paymentStatus)}
        </span>
      </td>

      <td>
        <select
          id="status-${order.id}"
          style="
            padding:7px;
            border:1px solid #ddd;
            border-radius:6px;
            background:white;
            min-width:130px;
          "
        >
          <option value="pending" ${orderStatus === "pending" ? "selected" : ""}>
            Pending
          </option>

          <option value="confirmed" ${orderStatus === "confirmed" ? "selected" : ""}>
            Confirmed
          </option>

          <option value="processing" ${orderStatus === "processing" ? "selected" : ""}>
            Processing
          </option>

          <option value="shipped" ${orderStatus === "shipped" ? "selected" : ""}>
            Shipped
          </option>

          <option value="delivered" ${orderStatus === "delivered" ? "selected" : ""}>
            Delivered
          </option>

          <option value="cancelled" ${orderStatus === "cancelled" ? "selected" : ""}>
            Cancelled
          </option>
        </select>

        <button
          class="view-btn"
          style="margin-top:6px;"
          onclick="updateOrderStatus('${order.id}')"
        >
          Save
        </button>
      </td>

      <td>
        <button
          class="view-btn"
          onclick="viewOrder('${order.id}')"
        >
          View
        </button>
      </td>
    `;

    body.appendChild(row);
  });
}


// ------------------------------------
// Update order status
// ------------------------------------

async function updateOrderStatus(orderId) {

  const select =
    document.getElementById(
      `status-${orderId}`
    );

  if (!select) {
    alert("Could not find the order status selector.");
    return;
  }

  const newStatus = select.value;

  const button =
    select.parentElement.querySelector(
      "button"
    );

  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  const { error } =
    await supabaseClient
      .from("orders")
      .update({
        order_status: newStatus
      })
      .eq("id", orderId);

  if (error) {

    console.error(
      "Order status update error:",
      error
    );

    alert(
      "Could not update order status:\n\n" +
      error.message
    );

    if (button) {
      button.disabled = false;
      button.textContent = "Save";
    }

    return;
  }

  // Update local order data
  artworkOrders =
    artworkOrders.map(order => {

      if (order.id === orderId) {
        return {
          ...order,
          order_status: newStatus
        };
      }

      return order;

    });

  renderOrders();

  alert(
    "Order status updated to: " +
    newStatus
  );
}


// ------------------------------------
// View order
// ------------------------------------

function viewOrder(id) {

  const order =
    artworkOrders.find(
      item => item.id === id
    );

  if (!order) return;

  const items =
    order.items || [];

  const itemDetails =
    items.length
      ? items.map(item => {

          const lineTotal =
            Number(item.unit_price || 0) *
            Number(item.quantity || 0);

          return `
${item.title_snapshot || "Artwork"}
Quantity: ${item.quantity || 0}
Unit Price: ${order.currency || "KES"} ${Number(
            item.unit_price || 0
          ).toLocaleString()}
Total: ${order.currency || "KES"} ${lineTotal.toLocaleString()}
`;

        }).join("\n--------------------\n")
      : "No artwork items found.";

  const details = `
ARTWORK ORDER

Order Number:
${order.order_number || "—"}

Date:
${order.created_at
  ? new Date(order.created_at).toLocaleString()
  : "—"}

CUSTOMER

Name:
${order.customer_name || "—"}

Email:
${order.customer_email || "—"}

Phone:
${order.customer_phone || "—"}

Delivery Address:
${order.delivery_address || "—"}

ARTWORK

${itemDetails}

ORDER SUMMARY

Subtotal:
${order.currency || "KES"} ${Number(
    order.subtotal || 0
  ).toLocaleString()}

Delivery Fee:
${order.currency || "KES"} ${Number(
    order.delivery_fee || 0
  ).toLocaleString()}

Total:
${order.currency || "KES"} ${Number(
    order.total || 0
  ).toLocaleString()}

Payment Status:
${order.payment_status || "pending"}

Order Status:
${order.order_status || "pending"}

Notes:
${order.notes || "—"}
`;

  alert(details);
}


// ====================================
// REFRESH BUTTONS
// ====================================

const refreshBtn =
  document.getElementById("refreshBtn");

if (refreshBtn) {

  refreshBtn.addEventListener(
    "click",
    async () => {

      await loadCommissionRequests();

    }
  );
}


const refreshOrdersBtn =
  document.getElementById(
    "refreshOrdersBtn"
  );

if (refreshOrdersBtn) {

  refreshOrdersBtn.addEventListener(
    "click",
    async () => {

      await loadOrders();

    }
  );
}


// ====================================
// LOGOUT
// ====================================

const logoutBtn =
  document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await supabaseClient.auth.signOut();

      window.location.reload();

    }
  );
}


// ====================================
// ERROR MESSAGE
// ====================================

function showError(message) {

  const errorBox =
    document.getElementById("errorMessage");

  if (!errorBox) return;

  errorBox.textContent = message;

  errorBox.style.display = "block";
}


// ====================================
// SECURITY HELPER
// ====================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
