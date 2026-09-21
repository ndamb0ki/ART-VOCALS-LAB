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

console.log("ABOUT TO LOAD ARTWORKS");

await loadAdminArtworks();

console.log("ARTWORKS FINISHED LOADING");
    
await loadArtClassCMS();

console.log("ART CLASS CMS FINISHED LOADING");

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

        <button
          type="button"
          onclick="deleteCommission('${request.id}')"
          style="
            display:block;
            margin-top:6px;
            background:#b00020;
            color:white;
            border:0;
            padding:7px 12px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          Delete
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

  <select
    id="payment-${order.id}"
    style="
      padding:7px;
      border:1px solid #ddd;
      border-radius:6px;
      background:white;
      min-width:120px;
    "
  >

    <option value="pending" ${paymentStatus === "pending" ? "selected" : ""}>
      Pending
    </option>

    <option value="paid" ${paymentStatus === "paid" ? "selected" : ""}>
      Paid
    </option>

    <option value="failed" ${paymentStatus === "failed" ? "selected" : ""}>
      Failed
    </option>

    <option value="refunded" ${paymentStatus === "refunded" ? "selected" : ""}>
      Refunded
    </option>

  </select>

  <button
    class="view-btn"
    style="margin-top:6px;"
    onclick="updatePaymentStatus('${order.id}')"
  >
    Save
  </button>

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

        <button
          type="button"
          onclick="deleteOrder('${order.id}')"
          style="
            display:block;
            margin-top:6px;
            background:#b00020;
            color:white;
            border:0;
            padding:7px 12px;
            border-radius:6px;
            cursor:pointer;
          "
        >
          Delete
        </button>

      </td>
    `;

    body.appendChild(row);
  });
}

// ------------------------------------
// Update payment status
// ------------------------------------

async function updatePaymentStatus(orderId) {

  const select = document.getElementById(`payment-${orderId}`);

  if (!select) {
    alert("Could not find the payment status selector.");
    return;
  }

  const newStatus = select.value;

  const button = select.parentElement.querySelector("button");

  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  const { error } = await supabaseClient
    .from("orders")
    .update({
      payment_status: newStatus
    })
    .eq("id", orderId);

  if (error) {

    console.error(
      "Payment status update error:",
      error
    );

    alert(
      "Could not update payment status:\n\n" +
      error.message
    );

    if (button) {
      button.disabled = false;
      button.textContent = "Save";
    }

    return;
  }

  artworkOrders = artworkOrders.map(order => {

    if (order.id === orderId) {
      return {
        ...order,
        payment_status: newStatus
      };
    }

    return order;

  });

  renderOrders();

  alert(
    "Payment status updated to: " +
    newStatus
  );
}


// ------------------------------------
// Update order status
// ------------------------------------

async function updateOrderStatus(orderId) {

  const select = document.getElementById(`status-${orderId}`);

  if (!select) {
    alert("Could not find the order status selector.");
    return;
  }

  const newStatus = select.value;

  const button = select.parentElement.querySelector("button");

  if (button) {
    button.disabled = true;
    button.textContent = "Saving...";
  }

  const { error } = await supabaseClient
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

  artworkOrders = artworkOrders.map(order => {

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
// View order in professional modal
// ------------------------------------

function viewOrder(id) {

  const order =
    artworkOrders.find(
      item => item.id === id
    );

  if (!order) return;

  const modal =
    document.getElementById("orderModal");

  const modalTitle =
    document.getElementById("orderModalTitle");

  const modalSubtitle =
    document.getElementById("orderModalSubtitle");

  const modalContent =
    document.getElementById("orderModalContent");

  if (!modal || !modalContent) {
    console.error("Order modal elements not found.");
    return;
  }

  const items =
    order.items || [];

  // --------------------------------
  // Artwork items
  // --------------------------------

  let itemsHTML = "";

  if (items.length === 0) {

    itemsHTML = `
      <div
        style="
          padding:15px;
          background:#f8f8f8;
          border-radius:8px;
          color:#777;
        "
      >
        No artwork items found.
      </div>
    `;

  } else {

    itemsHTML = items.map(item => {

      const quantity =
        Number(item.quantity || 0);

      const unitPrice =
        Number(item.unit_price || 0);

      const lineTotal =
        unitPrice * quantity;

      return `
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:20px;
            padding:15px 0;
            border-bottom:1px solid #eee;
          "
        >

          <div>

            <strong>
              ${escapeHTML(
                item.title_snapshot || "Artwork"
              )}
            </strong>

            <div
              style="
                margin-top:5px;
                color:#777;
                font-size:13px;
              "
            >
              Quantity: ${quantity}
            </div>

          </div>

          <div
            style="
              text-align:right;
              white-space:nowrap;
            "
          >

            <div style="font-size:13px;color:#777;">
              ${escapeHTML(order.currency || "KES")}
              ${unitPrice.toLocaleString()}
              each
            </div>

            <strong>
              ${escapeHTML(order.currency || "KES")}
              ${lineTotal.toLocaleString()}
            </strong>

          </div>

        </div>
      `;

    }).join("");

  }


  // --------------------------------
  // Status
  // --------------------------------

  const orderStatus =
    order.order_status || "pending";

  const paymentStatus =
    order.payment_status || "pending";

  const orderStatusClass =
    orderStatus
      .toLowerCase()
      .replace(/\s+/g, "-");

  const paymentStatusClass =
    paymentStatus
      .toLowerCase()
      .replace(/\s+/g, "-");


  // --------------------------------
  // Modal title
  // --------------------------------

  if (modalTitle) {

    modalTitle.textContent =
      order.order_number || "Order Details";

  }

  if (modalSubtitle) {

    modalSubtitle.textContent =
      "Artwork Order";

  }


  // --------------------------------
  // Modal content
  // --------------------------------

  modalContent.innerHTML = `

    <!-- CUSTOMER -->

    <section style="margin-bottom:25px;">

      <h3
        style="
          margin:0 0 15px;
          color:#071a33;
        "
      >
        Customer
      </h3>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
          gap:15px;
        "
      >

        <div>
          <small style="color:#777;">
            Name
          </small>

          <div>
            <strong>
              ${escapeHTML(
                order.customer_name || "—"
              )}
            </strong>
          </div>
        </div>


        <div>
          <small style="color:#777;">
            Email
          </small>

          <div>
            ${escapeHTML(
              order.customer_email || "—"
            )}
          </div>
        </div>


        <div>
          <small style="color:#777;">
            Phone
          </small>

          <div>
            ${escapeHTML(
              order.customer_phone || "—"
            )}
          </div>
        </div>


        <div>
          <small style="color:#777;">
            Order Date
          </small>

          <div>
            ${
              order.created_at
                ? escapeHTML(
                    new Date(
                      order.created_at
                    ).toLocaleString()
                  )
                : "—"
            }
          </div>
        </div>

      </div>

    </section>


    <!-- DELIVERY -->

    <section style="margin-bottom:25px;">

      <h3
        style="
          margin:0 0 15px;
          color:#071a33;
        "
      >
        Delivery
      </h3>

      <div
        style="
          padding:15px;
          background:#f8f8f8;
          border-radius:8px;
        "
      >
        ${escapeHTML(
          order.delivery_address || "No delivery address provided."
        )}
      </div>

    </section>


    <!-- ARTWORK -->

    <section style="margin-bottom:25px;">

      <h3
        style="
          margin:0 0 5px;
          color:#071a33;
        "
      >
        Artwork
      </h3>

      ${itemsHTML}

    </section>


    <!-- ORDER SUMMARY -->

    <section style="margin-bottom:25px;">

      <h3
        style="
          margin:0 0 15px;
          color:#071a33;
        "
      >
        Order Summary
      </h3>

      <div
        style="
          background:#f8f8f8;
          border-radius:8px;
          padding:18px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            padding:7px 0;
          "
        >
          <span>Subtotal</span>

          <strong>
            ${escapeHTML(order.currency || "KES")}
            ${Number(
              order.subtotal || 0
            ).toLocaleString()}
          </strong>
        </div>


        <div
          style="
            display:flex;
            justify-content:space-between;
            padding:7px 0;
          "
        >
          <span>Delivery Fee</span>

          <strong>
            ${escapeHTML(order.currency || "KES")}
            ${Number(
              order.delivery_fee || 0
            ).toLocaleString()}
          </strong>
        </div>


        <div
          style="
            display:flex;
            justify-content:space-between;
            padding:12px 0 0;
            margin-top:8px;
            border-top:1px solid #ddd;
            font-size:18px;
          "
        >
          <strong>Total</strong>

          <strong>
            ${escapeHTML(order.currency || "KES")}
            ${Number(
              order.total || 0
            ).toLocaleString()}
          </strong>
        </div>

      </div>

    </section>


    <!-- STATUS -->

    <section style="margin-bottom:25px;">

      <h3
        style="
          margin:0 0 15px;
          color:#071a33;
        "
      >
        Status
      </h3>

      <div
        style="
          display:flex;
          flex-wrap:wrap;
          gap:15px;
        "
      >

        <div>

          <small
            style="
              display:block;
              color:#777;
              margin-bottom:6px;
            "
          >
            Payment
          </small>

          <span class="status status-${paymentStatusClass}">
            ${escapeHTML(paymentStatus)}
          </span>

        </div>


        <div>

          <small
            style="
              display:block;
              color:#777;
              margin-bottom:6px;
            "
          >
            Order
          </small>

          <span class="status status-${orderStatusClass}">
            ${escapeHTML(orderStatus)}
          </span>

        </div>

      </div>

    </section>


    <!-- NOTES -->

    <section>

      <h3
        style="
          margin:0 0 10px;
          color:#071a33;
        "
      >
        Customer Notes
      </h3>

      <div
        style="
          padding:15px;
          background:#f8f8f8;
          border-radius:8px;
          color:#555;
          white-space:pre-wrap;
        "
      >
        ${escapeHTML(
          order.notes || "No notes provided."
        )}
      </div>

    </section>

  `;


  // --------------------------------
  // Show modal
  // --------------------------------

  modal.style.display = "block";

  document.body.style.overflow = "hidden";
}


// ------------------------------------
// Close order modal
// ------------------------------------

function closeOrderModal() {

  const modal =
    document.getElementById("orderModal");

  if (modal) {
    modal.style.display = "none";
  }

  document.body.style.overflow = "";
}


// ------------------------------------
// Modal buttons
// ------------------------------------

const closeOrderModalButton =
  document.getElementById("closeOrderModal");

if (closeOrderModalButton) {

  closeOrderModalButton.addEventListener(
    "click",
    closeOrderModal
  );

}


const closeOrderModalBottom =
  document.getElementById(
    "closeOrderModalBottom"
  );

if (closeOrderModalBottom) {

  closeOrderModalBottom.addEventListener(
    "click",
    closeOrderModal
  );

}


// ------------------------------------
// Close modal when clicking outside
// ------------------------------------

const orderModal =
  document.getElementById("orderModal");

if (orderModal) {

  orderModal.addEventListener(
    "click",
    event => {

      if (event.target === orderModal) {
        closeOrderModal();
      }

    }
  );

}


// ------------------------------------
// Close modal with Escape key
// ------------------------------------

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {
      closeOrderModal();
    }

  }
);


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
// ====================================
// SHOP — ADD / PUBLISH ARTWORK
// ====================================

// ------------------------------------
// Artwork image preview
// ------------------------------------

const artworkImage =
  document.getElementById("artworkImage");

const artworkImagePreview =
  document.getElementById("artworkImagePreview");

if (artworkImage) {

  artworkImage.addEventListener(
    "change",
    () => {

      const file = artworkImage.files[0];

      if (!file) {

        if (artworkImagePreview) {
          artworkImagePreview.style.display = "none";
          artworkImagePreview.src = "";
        }

        return;
      }

      const imageURL =
        URL.createObjectURL(file);

      if (artworkImagePreview) {

        artworkImagePreview.src = imageURL;

        artworkImagePreview.style.display = "block";
      }

    }
  );
}


// ------------------------------------
// Artwork publishing form
// ------------------------------------

const artworkForm =
  document.getElementById("artworkForm");

if (artworkForm) {

  artworkForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const publishButton =
        document.getElementById(
          "publishArtworkBtn"
        );

      const messageBox =
        document.getElementById(
          "artworkFormMessage"
        );

      const imageInput =
        document.getElementById(
          "artworkImage"
        );

      const titleInput =
        document.getElementById(
          "artworkTitle"
        );

      const descriptionInput =
        document.getElementById(
          "artworkDescription"
        );

      const priceInput =
        document.getElementById(
          "artworkPrice"
        );

      const currencyInput =
        document.getElementById(
          "artworkCurrency"
        );

      const categoryInput =
        document.getElementById(
          "artworkCategory"
        );

      const sizeInput =
        document.getElementById(
          "artworkSize"
        );

      const statusInput =
        document.getElementById(
          "artworkStatus"
        );

      const featuredInput =
        document.getElementById(
          "artworkFeatured"
        );


      // --------------------------------
      // Clear previous message
      // --------------------------------

      if (messageBox) {

        messageBox.className =
          "form-message";

        messageBox.textContent = "";

        messageBox.style.display = "none";
      }


      // --------------------------------
      // Get form values
      // --------------------------------

      const file =
        imageInput?.files?.[0];

      const title =
        titleInput?.value.trim();

      const description =
        descriptionInput?.value.trim();

      const price =
        Number(priceInput?.value);

      const currency =
        currencyInput?.value || "KES";

      const category =
        categoryInput?.value || "";

      const size =
        sizeInput?.value.trim();

      const status =
        statusInput?.value || "available";

      const featured =
        featuredInput?.checked || false;


      // --------------------------------
      // Validate
      // --------------------------------

      if (!file) {

        showArtworkMessage(
          "Please select an artwork image.",
          "error"
        );

        return;
      }


      if (!title) {

        showArtworkMessage(
          "Please enter the artwork title.",
          "error"
        );

        return;
      }


      if (
        !priceInput?.value ||
        Number.isNaN(price) ||
        price < 0
      ) {

        showArtworkMessage(
          "Please enter a valid artwork price.",
          "error"
        );

        return;
      }


      // --------------------------------
      // Check image type
      // --------------------------------

      if (!file.type.startsWith("image/")) {

        showArtworkMessage(
          "Please upload a valid image file.",
          "error"
        );

        return;
      }


      // --------------------------------
      // Disable button
      // --------------------------------

      if (publishButton) {

        publishButton.disabled = true;

        publishButton.textContent =
          "Uploading artwork...";
      }


      let uploadedFilePath = null;


      try {

        // --------------------------------
        // Create safe filename
        // --------------------------------

        const originalName =
          file.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9._-]/g, "");

        const uniqueName =
          `${crypto.randomUUID()}-${originalName}`;

        uploadedFilePath =
          `artworks/${uniqueName}`;


        // --------------------------------
        // Upload image to Supabase Storage
        // --------------------------------

        const {
          error: uploadError
        } =
          await supabaseClient
            .storage
            .from("artworks")
            .upload(
              uploadedFilePath,
              file,
              {
                cacheControl: "3600",
                upsert: false
              }
            );


        if (uploadError) {

          console.error(
            "Artwork image upload error:",
            uploadError
          );

          throw new Error(
            "Image upload failed: " +
            uploadError.message
          );
        }


        // --------------------------------
        // Get public image URL
        // --------------------------------

        const {
          data: publicURLData
        } =
          supabaseClient
            .storage
            .from("artworks")
            .getPublicUrl(
              uploadedFilePath
            );


        const imageURL =
          publicURLData?.publicUrl;


        if (!imageURL) {

          throw new Error(
            "Could not create the public image URL."
          );
        }


        // --------------------------------
        // Create slug
        // --------------------------------

        let slug =
          title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");


        // Add unique ending to avoid
        // duplicate slug problems

        slug =
          `${slug}-${Date.now()}`;


        // --------------------------------
        // Update button
        // --------------------------------

        if (publishButton) {

          publishButton.textContent =
            "Publishing artwork...";
        }


        // --------------------------------
        // Insert artwork into database
        // --------------------------------

        const {
          data: artwork,
          error: artworkError
        } =
          await supabaseClient
            .from("artworks")
            .insert([
              {
                title: title,

                slug: slug,

                description:
                  description || null,

                category:
                  category || null,

                size:
                  size || null,

                price:
                  price,

                currency:
                  currency,

                image_url:
                  imageURL,

                status:
                  status,

                featured:
                  featured
              }
            ])
            .select()
            .single();


        if (artworkError) {

          console.error(
            "Artwork database error:",
            artworkError
          );


          // --------------------------------
          // Remove uploaded image if
          // database insertion failed
          // --------------------------------

          if (uploadedFilePath) {

            await supabaseClient
              .storage
              .from("artworks")
              .remove([
                uploadedFilePath
              ]);

          }


          throw new Error(
            "Artwork could not be published: " +
            artworkError.message
          );
        }


        // --------------------------------
        // Success
        // --------------------------------

        console.log(
          "Artwork published:",
          artwork
        );


        showArtworkMessage(
          "Artwork published successfully!",
          "success"
        );


        // --------------------------------
        // Reset form
        // --------------------------------

        artworkForm.reset();


        if (artworkImagePreview) {

          artworkImagePreview.src = "";

          artworkImagePreview.style.display =
            "none";
        }


      } catch (error) {

        console.error(
          "Artwork publishing error:",
          error
        );


        showArtworkMessage(
          error.message ||
          "Something went wrong while publishing the artwork.",
          "error"
        );

      } finally {

        // --------------------------------
        // Re-enable button
        // --------------------------------

        if (publishButton) {

          publishButton.disabled = false;

          publishButton.textContent =
            "Publish Artwork";
        }

      }

    }
  );

}


// ------------------------------------
// Shop form message
// ------------------------------------

function showArtworkMessage(
  message,
  type
) {

  const messageBox =
    document.getElementById(
      "artworkFormMessage"
    );

  if (!messageBox) {

    alert(message);

    return;
  }


  messageBox.textContent =
    message;


  messageBox.className =
    "form-message";


  if (type === "success") {

    messageBox.classList.add(
      "success"
    );

  } else {

    messageBox.classList.add(
      "error-message"
    );

  }


  messageBox.style.display =
    "block";

}
// ====================================
// ARTWORK MANAGEMENT
// ====================================

// ------------------------------------
// Load artworks for admin management
// ------------------------------------

async function loadAdminArtworks() {

  let section =
    document.getElementById("adminArtworkManagement");

  // Create management section if it doesn't
  // already exist in admin.html
  if (!section) {

    section = document.createElement("section");

    section.id = "adminArtworkManagement";

    section.style.cssText = `
      margin-top:40px;
      padding:25px;
      background:white;
      border-radius:12px;
      box-shadow:0 2px 15px rgba(0,0,0,.06);
    `;

    const artworkForm =
      document.getElementById("artworkForm");

     const container =
      document.querySelector(".container");

    if (container) {
      container.appendChild(section);
    }
  }

  section.innerHTML = `
    <h2 style="
      margin-top:0;
      color:#071a33;
    ">
      Artwork Management
    </h2>

    <p style="
      color:#777;
      margin-bottom:25px;
    ">
      Manage artworks currently published in your shop.
    </p>

    <div id="adminArtworkLoading"
      style="
        padding:20px;
        text-align:center;
        color:#777;
      "
    >
      Loading artworks...
    </div>

    <div
      id="adminArtworkGrid"
      style="
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(250px,1fr));
        gap:20px;
      "
    ></div>
  `;

  const {
    data: artworks,
    error
  } = await supabaseClient
    .from("artworks")
    .select("*")
    .order("created_at", {
      ascending:false
    });

  const loading =
    document.getElementById(
      "adminArtworkLoading"
    );

  const grid =
    document.getElementById(
      "adminArtworkGrid"
    );

  if (loading) {
    loading.style.display = "none";
  }

  if (error) {

    console.error(
      "Admin artworks loading error:",
      error
    );

    if (grid) {

      grid.innerHTML = `
        <div style="
          padding:20px;
          color:#b00020;
        ">
          Could not load artworks:
          ${escapeHTML(error.message)}
        </div>
      `;

    }

    return;
  }

  if (!artworks || artworks.length === 0) {

    if (grid) {

      grid.innerHTML = `
        <div style="
          padding:25px;
          background:#f8f8f8;
          border-radius:8px;
          color:#777;
        ">
          No artworks have been published yet.
        </div>
      `;

    }

    return;
  }

  artworks.forEach(artwork => {

    const card =
      document.createElement("div");

    card.style.cssText = `
      border:1px solid #e5e5e5;
      border-radius:10px;
      overflow:hidden;
      background:white;
    `;

    const image =
      artwork.image_url || "";

    const title =
      artwork.title || "Untitled Artwork";

    const status =
      artwork.status || "available";

    const statusLabel =
      status.toLowerCase() === "sold"
        ? "SOLD"
        : "AVAILABLE";

    const statusBackground =
      status.toLowerCase() === "sold"
        ? "#b00020"
        : "#176b35";

    const price =
      Number(artwork.price || 0)
        .toLocaleString();

    card.innerHTML = `

      <div style="
        height:220px;
        background:#f5f5f5;
        overflow:hidden;
      ">

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                "
              >
            `
            : `
              <div style="
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#999;
              ">
                No Image
              </div>
            `
        }

      </div>

      <div style="
        padding:18px;
      ">

        <h3 style="
          margin:0 0 8px;
          color:#071a33;
        ">
          ${escapeHTML(title)}
        </h3>

        <div style="
          margin-bottom:8px;
          color:#555;
        ">
          ${escapeHTML(
            artwork.currency || "KES"
          )}
          ${price}
        </div>

        <div style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-bottom:15px;
        ">

          <span style="
            background:${statusBackground};
            color:white;
            padding:5px 9px;
            border-radius:20px;
            font-size:12px;
            font-weight:bold;
          ">
            ${statusLabel}
          </span>

          ${
            artwork.featured
              ? `
                <span style="
                  background:#071a33;
                  color:white;
                  padding:5px 9px;
                  border-radius:20px;
                  font-size:12px;
                ">
                  FEATURED
                </span>
              `
              : ""
          }

        </div>

        <div style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        ">

          <button
            type="button"
            class="view-btn"
            onclick="toggleArtworkStatus('${artwork.id}', '${status}')"
          >
            ${
              status.toLowerCase() === "sold"
                ? "Mark Available"
                : "Mark Sold"
            }
          </button>

          <button
            type="button"
            class="view-btn"
            onclick="toggleArtworkFeatured('${artwork.id}', ${Boolean(
              artwork.featured
            )})"
          >
            ${
              artwork.featured
                ? "Unfeature"
                : "Feature"
            }
          </button>

          <button
            type="button"
            onclick="deleteArtwork('${artwork.id}')"
            style="
              background:#b00020;
              color:white;
              border:0;
              padding:8px 12px;
              border-radius:6px;
              cursor:pointer;
            "
          >
            Delete
          </button>

        </div>

      </div>
    `;

    grid.appendChild(card);

  });
}


// ------------------------------------
// Delete artwork
// ------------------------------------

async function deleteArtwork(artworkId) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this artwork?\n\n" +
      "This will remove the artwork from the shop."
    );

  if (!confirmed) {
    return;
  }

  try {

    // Get artwork first so we know
    // which image belongs to it
    const {
      data: artwork,
      error: fetchError
    } = await supabaseClient
      .from("artworks")
      .select("id, title, image_url")
      .eq("id", artworkId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete database record
    const {
      error: deleteError
    } = await supabaseClient
      .from("artworks")
      .delete()
      .eq("id", artworkId);

    if (deleteError) {

      console.error(
        "Artwork delete error:",
        deleteError
      );

      throw new Error(
        "Could not delete artwork:\n\n" +
        deleteError.message
      );
    }

    // --------------------------------
    // Remove Storage image
    // --------------------------------

    if (artwork?.image_url) {

      try {

        const marker =
          "/storage/v1/object/public/artworks/";

        const markerIndex =
          artwork.image_url.indexOf(marker);

        if (markerIndex !== -1) {

          const filePath =
            decodeURIComponent(
              artwork.image_url.substring(
                markerIndex + marker.length
              )
            );

          if (filePath) {

            const {
              error: storageError
            } =
              await supabaseClient
                .storage
                .from("artworks")
                .remove([
                  filePath
                ]);

            if (storageError) {

              console.warn(
                "Artwork database record deleted, " +
                "but image could not be removed:",
                storageError
              );

            }

          }

        }

      } catch (storageError) {

        console.warn(
          "Storage cleanup error:",
          storageError
        );

      }

    }

    alert(
      `"${artwork?.title || "Artwork"}" was deleted successfully.`
    );

    await loadAdminArtworks();

  } catch (error) {

    console.error(
      "Delete artwork error:",
      error
    );

    alert(
      "Could not delete artwork:\n\n" +
      error.message
    );

  }

}


// ------------------------------------
// Toggle artwork status
// ------------------------------------

async function toggleArtworkStatus(
  artworkId,
  currentStatus
) {

  const newStatus =
    String(currentStatus).toLowerCase() === "sold"
      ? "available"
      : "sold";

  const { error } =
    await supabaseClient
      .from("artworks")
      .update({
        status:newStatus
      })
      .eq("id", artworkId);

  if (error) {

    console.error(
      "Artwork status update error:",
      error
    );

    alert(
      "Could not update artwork status:\n\n" +
      error.message
    );

    return;
  }

  await loadAdminArtworks();

}


// ------------------------------------
// Toggle featured status
// ------------------------------------

async function toggleArtworkFeatured(
  artworkId,
  currentFeatured
) {

  const newFeatured =
    !Boolean(currentFeatured);

  const { error } =
    await supabaseClient
      .from("artworks")
      .update({
        featured:newFeatured
      })
      .eq("id", artworkId);

  if (error) {

    console.error(
      "Artwork featured update error:",
      error
    );

    alert(
      "Could not update featured status:\n\n" +
      error.message
    );

    return;
  }

  await loadAdminArtworks();

}
// ====================================
// DELETE ORDER
// ====================================

async function deleteOrder(orderId) {

  const order =
    artworkOrders.find(
      item => item.id === orderId
    );

  if (!order) {
    alert("Order could not be found.");
    return;
  }

  const orderNumber =
    order.order_number || orderId;

  const confirmed =
    confirm(
      "DELETE ORDER?\n\n" +
      `Order: ${orderNumber}\n\n` +
      "This will permanently delete the order " +
      "and its order items.\n\n" +
      "This cannot be undone."
    );

  if (!confirmed) {
    return;
  }

  try {

    // --------------------------------
    // Delete order items first
    // --------------------------------

    const {
      error: itemsError
    } =
      await supabaseClient
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

    if (itemsError) {

      console.error(
        "Order items delete error:",
        itemsError
      );

      throw new Error(
        "Could not delete order items:\n\n" +
        itemsError.message
      );
    }


    // --------------------------------
    // Delete order
    // --------------------------------

    const {
      error: orderError
    } =
      await supabaseClient
        .from("orders")
        .delete()
        .eq("id", orderId);

    if (orderError) {

      console.error(
        "Order delete error:",
        orderError
      );

      throw new Error(
        "Could not delete order:\n\n" +
        orderError.message
      );
    }


    // --------------------------------
    // Refresh orders
    // --------------------------------

    alert(
      `Order ${orderNumber} was deleted successfully.`
    );

    await loadOrders();

  } catch (error) {

    console.error(
      "Delete order error:",
      error
    );

    alert(
      "Could not delete order:\n\n" +
      error.message
    );

  }

}
// ====================================
// DELETE COMMISSION REQUEST
// ====================================

async function deleteCommission(commissionId) {

  const request =
    commissionRequests.find(
      item => item.id === commissionId
    );

  if (!request) {

    alert(
      "Commission request could not be found."
    );

    return;
  }

  const customerName =
    request.name || "Unknown customer";

  const confirmed =
    confirm(
      "DELETE COMMISSION REQUEST?\n\n" +
      `Customer: ${customerName}\n` +
      `Artwork: ${request.artwork_type || "—"}\n\n` +
      "This will permanently delete this commission request.\n\n" +
      "This cannot be undone."
    );

  if (!confirmed) {
    return;
  }

  try {

    const {
      error
    } = await supabaseClient
      .from("commission_requests")
      .delete()
      .eq("id", commissionId);

    if (error) {

      console.error(
        "Commission delete error:",
        error
      );

      throw new Error(
        "Could not delete commission request:\n\n" +
        error.message
      );
    }

    // Remove it from the local dashboard
    commissionRequests =
      commissionRequests.filter(
        item => item.id !== commissionId
      );

    // Refresh dashboard
    updateStatistics();
    renderRequests();

    alert(
      "Commission request deleted successfully."
    );

  } catch (error) {

    console.error(
      "Delete commission error:",
      error
    );

    alert(
      "Could not delete commission request:\n\n" +
      error.message
    );

  }
}
// ====================================
// ART CLASS CMS
// ====================================

let artClassPosts = [];
let artClassComments = [];


// ------------------------------------
// Load Art Class CMS
// ------------------------------------

async function loadArtClassCMS() {

  let section =
    document.getElementById("artClassCMS");

  if (!section) {

    section = document.createElement("section");

    section.id = "artClassCMS";

    section.style.cssText = `
      margin-top:40px;
      padding:25px;
      background:white;
      border-radius:12px;
      box-shadow:0 2px 15px rgba(0,0,0,.06);
    `;

    const container =
      document.querySelector(".container");

    if (container) {
      container.appendChild(section);
    }
  }

  section.innerHTML = `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:15px;
      flex-wrap:wrap;
      margin-bottom:25px;
    ">

      <div>
        <h2 style="
          margin:0;
          color:#071a33;
        ">
          Art Class CMS
        </h2>

        <p style="
          margin:7px 0 0;
          color:#777;
        ">
          Manage Art Class posts, student work,
          likes and community comments.
        </p>
      </div>

      <button
        type="button"
        onclick="loadArtClassCMS()"
        style="
          background:#071a33;
          color:white;
          border:0;
          padding:10px 16px;
          border-radius:7px;
          cursor:pointer;
        "
      >
        Refresh
      </button>

    </div>


    <!-- CREATE POST -->

    <div style="
      background:#f8f8f8;
      padding:22px;
      border-radius:10px;
      margin-bottom:30px;
    ">

      <h3 style="
        margin-top:0;
        color:#071a33;
      ">
        Create Art Class Post
      </h3>

      <form id="artClassPostForm">

        <div style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(220px,1fr));
          gap:15px;
        ">

          <div>
            <label>
              <strong>Title</strong>
            </label>

            <input
              type="text"
              id="artClassTitle"
              required
              placeholder="e.g. Young Artists at Work"
              style="
                width:100%;
                box-sizing:border-box;
                padding:11px;
                margin-top:6px;
                border:1px solid #ddd;
                border-radius:7px;
              "
            >
          </div>


          <div>
            <label>
              <strong>Category</strong>
            </label>

            <select
              id="artClassCategory"
              style="
                width:100%;
                box-sizing:border-box;
                padding:11px;
                margin-top:6px;
                border:1px solid #ddd;
                border-radius:7px;
                background:white;
              "
            >
              <option value="Art Class">
                Art Class
              </option>

              <option value="Students">
                Students
              </option>

              <option value="Drawing">
                Drawing
              </option>

              <option value="Painting">
                Painting
              </option>

              <option value="Art Lab">
                Art Lab
              </option>

              <option value="Craft">
                Craft
              </option>

              <option value="Exhibition">
                Exhibition
              </option>

              <option value="Community">
                Community
              </option>
            </select>
          </div>

        </div>


        <div style="margin-top:15px;">

          <label>
            <strong>Description</strong>
          </label>

          <textarea
            id="artClassDescription"
            rows="4"
            placeholder="Tell the story behind this post..."
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:6px;
              border:1px solid #ddd;
              border-radius:7px;
              resize:vertical;
            "
          ></textarea>

        </div>


        <div style="margin-top:15px;">

          <label>
            <strong>Image</strong>
          </label>

          <input
            type="file"
            id="artClassImage"
            accept="image/*"
            required
            style="
              display:block;
              margin-top:8px;
            "
          >

          <img
            id="artClassImagePreview"
            src=""
            alt="Preview"
            style="
              display:none;
              margin-top:12px;
              width:180px;
              height:130px;
              object-fit:cover;
              border-radius:8px;
            "
          >

        </div>


        <div style="
          display:flex;
          flex-wrap:wrap;
          gap:20px;
          margin-top:18px;
        ">

          <label style="
            display:flex;
            align-items:center;
            gap:8px;
            cursor:pointer;
          ">

            <input
              type="checkbox"
              id="artClassFeatured"
            >

            Featured post

          </label>


          <label style="
            display:flex;
            align-items:center;
            gap:8px;
            cursor:pointer;
          ">

            <input
              type="checkbox"
              id="artClassPublished"
              checked
            >

            Publish immediately

          </label>

        </div>


        <button
          type="submit"
          id="publishArtClassBtn"
          style="
            margin-top:20px;
            background:#071a33;
            color:white;
            border:0;
            padding:12px 20px;
            border-radius:7px;
            cursor:pointer;
          "
        >
          Publish Art Class Post
        </button>


        <div
          id="artClassFormMessage"
          style="
            display:none;
            margin-top:15px;
            padding:12px;
            border-radius:7px;
          "
        ></div>

      </form>

    </div>


    <!-- POSTS -->

    <div>

      <h3 style="
        color:#071a33;
        margin-bottom:15px;
      ">
        Art Class Posts
      </h3>

      <div
        id="artClassPostsLoading"
        style="
          padding:20px;
          text-align:center;
          color:#777;
        "
      >
        Loading Art Class posts...
      </div>

      <div
        id="artClassPostsGrid"
        style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(280px,1fr));
          gap:20px;
        "
      ></div>

    </div>

  `;


  // ------------------------------------
  // Image preview
  // ------------------------------------

  const imageInput =
    document.getElementById(
      "artClassImage"
    );

  const imagePreview =
    document.getElementById(
      "artClassImagePreview"
    );

  if (imageInput && imagePreview) {

    imageInput.addEventListener(
      "change",
      () => {

        const file =
          imageInput.files?.[0];

        if (!file) {

          imagePreview.src = "";
          imagePreview.style.display =
            "none";

          return;
        }

        imagePreview.src =
          URL.createObjectURL(file);

        imagePreview.style.display =
          "block";
      }
    );

  }


  // ------------------------------------
  // Form submission
  // ------------------------------------

  const form =
    document.getElementById(
      "artClassPostForm"
    );

  if (form) {

    form.addEventListener(
      "submit",
      handleArtClassPostSubmit
    );

  }


  await fetchArtClassPosts();
}


// ------------------------------------
// Submit Art Class post
// ------------------------------------

async function handleArtClassPostSubmit(event) {

  event.preventDefault();

  const title =
    document
      .getElementById("artClassTitle")
      ?.value
      .trim();

  const description =
    document
      .getElementById("artClassDescription")
      ?.value
      .trim();

  const category =
    document
      .getElementById("artClassCategory")
      ?.value || "Art Class";

  const imageInput =
    document.getElementById(
      "artClassImage"
    );

  const featured =
    document
      .getElementById("artClassFeatured")
      ?.checked || false;

  const published =
    document
      .getElementById("artClassPublished")
      ?.checked || false;

  const button =
    document.getElementById(
      "publishArtClassBtn"
    );

  if (!title) {

    showArtClassMessage(
      "Please enter a title.",
      "error"
    );

    return;
  }

  const file =
    imageInput?.files?.[0];

  if (!file) {

    showArtClassMessage(
      "Please select an image.",
      "error"
    );

    return;
  }

  if (!file.type.startsWith("image/")) {

    showArtClassMessage(
      "Please select a valid image.",
      "error"
    );

    return;
  }

  if (button) {

    button.disabled = true;
    button.textContent =
      "Uploading...";

  }

  try {

    const safeName =
      file.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9._-]/g, "");

    const filePath =
      `posts/${crypto.randomUUID()}-${safeName}`;


    // --------------------------------
    // Upload image
    // --------------------------------

    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from("art-class")
        .upload(
          filePath,
          file,
          {
            cacheControl:"3600",
            upsert:false
          }
        );

    if (uploadError) {

      console.error(
        "Art Class image upload error:",
        uploadError
      );

      throw new Error(
        "Image upload failed: " +
        uploadError.message
      );

    }


    // --------------------------------
    // Get public URL
    // --------------------------------

    const {
      data: publicURLData
    } =
      supabaseClient
        .storage
        .from("art-class")
        .getPublicUrl(filePath);

    const imageURL =
      publicURLData?.publicUrl;

    if (!imageURL) {

      throw new Error(
        "Could not create the image URL."
      );

    }


    // --------------------------------
    // Insert post
    // --------------------------------

    if (button) {
      button.textContent =
        "Publishing...";
    }

    const {
      data: post,
      error: postError
    } =
      await supabaseClient
        .from("art_class_posts")
        .insert([
          {
            title:title,
            description:
              description || null,
            image_url:imageURL,
            category:category,
            featured:featured,
            published:published,
            likes_count:0
          }
        ])
        .select()
        .single();


    if (postError) {

      console.error(
        "Art Class post database error:",
        postError
      );


      // Remove uploaded image
      await supabaseClient
        .storage
        .from("art-class")
        .remove([filePath]);


      throw new Error(
        "Post could not be created: " +
        postError.message
      );

    }


    console.log(
      "Art Class post created:",
      post
    );


    showArtClassMessage(
      "Art Class post published successfully!",
      "success"
    );


    formResetArtClass();


    await fetchArtClassPosts();

  } catch (error) {

    console.error(
      "Art Class publishing error:",
      error
    );

    showArtClassMessage(
      error.message ||
      "Something went wrong.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Publish Art Class Post";

    }

  }

}


// ------------------------------------
// Fetch Art Class posts
// ------------------------------------

async function fetchArtClassPosts() {

  const loading =
    document.getElementById(
      "artClassPostsLoading"
    );

  const grid =
    document.getElementById(
      "artClassPostsGrid"
    );

  if (!grid) return;

  if (loading) {
    loading.style.display = "block";
  }

  grid.innerHTML = "";


  const {
    data: posts,
    error
  } =
    await supabaseClient
      .from("art_class_posts")
      .select("*")
      .order(
        "created_at",
        {
          ascending:false
        }
      );


  if (loading) {
    loading.style.display = "none";
  }


  if (error) {

    console.error(
      "Art Class posts loading error:",
      error
    );

    grid.innerHTML = `
      <div style="
        padding:20px;
        background:#fff3f3;
        color:#b00020;
        border-radius:8px;
      ">
        Could not load Art Class posts:
        ${escapeHTML(error.message)}
      </div>
    `;

    return;
  }


  artClassPosts =
    posts || [];


  // --------------------------------
  // Load comments
  // --------------------------------

  const {
    data: comments,
    error: commentsError
  } =
    await supabaseClient
      .from("art_class_comments")
      .select("*")
      .order(
        "created_at",
        {
          ascending:false
        }
      );


  if (commentsError) {

    console.warn(
      "Comments loading error:",
      commentsError
    );

    artClassComments = [];

  } else {

    artClassComments =
      comments || [];

  }


  renderArtClassPosts();

}


// ------------------------------------
// Render posts
// ------------------------------------

function renderArtClassPosts() {

  const grid =
    document.getElementById(
      "artClassPostsGrid"
    );

  if (!grid) return;

  grid.innerHTML = "";


  if (artClassPosts.length === 0) {

    grid.innerHTML = `
      <div style="
        padding:25px;
        background:#f8f8f8;
        border-radius:8px;
        color:#777;
      ">
        No Art Class posts yet.
      </div>
    `;

    return;
  }


  artClassPosts.forEach(post => {

    const card =
      document.createElement("article");


    const comments =
      artClassComments.filter(
        comment =>
          comment.post_id === post.id
      );


    const image =
      post.image_url || "";

    const title =
      post.title || "Untitled";

    const category =
      post.category || "Art Class";

    const description =
      post.description || "";

    const likes =
      Number(post.likes_count || 0);


    card.style.cssText = `
      border:1px solid #e5e5e5;
      border-radius:12px;
      overflow:hidden;
      background:white;
      box-shadow:0 2px 10px rgba(0,0,0,.05);
    `;


    card.innerHTML = `

      <div style="
        height:240px;
        background:#f3f3f3;
        overflow:hidden;
      ">

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:cover;
                "
              >
            `
            : `
              <div style="
                height:100%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#999;
              ">
                No image
              </div>
            `
        }

      </div>


      <div style="
        padding:18px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:center;
          margin-bottom:10px;
        ">

          <span style="
            background:#071a33;
            color:white;
            padding:5px 9px;
            border-radius:20px;
            font-size:11px;
          ">
            ${escapeHTML(category)}
          </span>


          ${
            post.featured
              ? `
                <span style="
                  background:#f1c40f;
                  color:#071a33;
                  padding:5px 9px;
                  border-radius:20px;
                  font-size:11px;
                  font-weight:bold;
                ">
                  FEATURED
                </span>
              `
              : ""
          }

        </div>


        <h3 style="
          margin:0 0 8px;
          color:#071a33;
        ">
          ${escapeHTML(title)}
        </h3>


        <p style="
          color:#666;
          line-height:1.5;
          margin:0 0 15px;
        ">
          ${escapeHTML(description)}
        </p>


        <div style="
          display:flex;
          gap:15px;
          color:#666;
          font-size:14px;
          margin-bottom:15px;
        ">

          <span>
            ♥ ${likes}
            ${likes === 1 ? "like" : "likes"}
          </span>

          <span>
            💬 ${comments.length}
            ${comments.length === 1
              ? "comment"
              : "comments"}
          </span>

        </div>


        <div style="
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        ">

          <button
            type="button"
            class="view-btn"
            onclick="toggleArtClassPublished(
              '${post.id}',
              ${Boolean(post.published)}
            )"
          >
            ${
              post.published
                ? "Unpublish"
                : "Publish"
            }
          </button>


          <button
            type="button"
            class="view-btn"
            onclick="toggleArtClassFeatured(
              '${post.id}',
              ${Boolean(post.featured)}
            )"
          >
            ${
              post.featured
                ? "Unfeature"
                : "Feature"
            }
          </button>


          <button
            type="button"
            class="view-btn"
            onclick="viewArtClassComments(
              '${post.id}'
            )"
          >
            Comments
          </button>


          <button
            type="button"
            onclick="deleteArtClassPost(
              '${post.id}'
            )"
            style="
              background:#b00020;
              color:white;
              border:0;
              padding:8px 12px;
              border-radius:6px;
              cursor:pointer;
            "
          >
            Delete
          </button>

        </div>


        <div style="
          margin-top:12px;
          font-size:12px;
          color:#999;
        ">

          ${
            post.published
              ? "● Published"
              : "○ Draft"
          }

          ${
            post.created_at
              ? `
                · ${escapeHTML(
                    new Date(
                      post.created_at
                    ).toLocaleDateString()
                  )}
              `
              : ""
          }

        </div>

      </div>

    `;


    grid.appendChild(card);

  });

}


// ------------------------------------
// Toggle published
// ------------------------------------

async function toggleArtClassPublished(
  postId,
  currentPublished
) {

  const newValue =
    !Boolean(currentPublished);


  const { error } =
    await supabaseClient
      .from("art_class_posts")
      .update({
        published:newValue
      })
      .eq("id", postId);


  if (error) {

    console.error(
      "Publish status error:",
      error
    );

    alert(
      "Could not update publication status:\n\n" +
      error.message
    );

    return;
  }


  await fetchArtClassPosts();

}


// ------------------------------------
// Toggle featured
// ------------------------------------

async function toggleArtClassFeatured(
  postId,
  currentFeatured
) {

  const newValue =
    !Boolean(currentFeatured);


  const { error } =
    await supabaseClient
      .from("art_class_posts")
      .update({
        featured:newValue
      })
      .eq("id", postId);


  if (error) {

    console.error(
      "Featured status error:",
      error
    );

    alert(
      "Could not update featured status:\n\n" +
      error.message
    );

    return;
  }


  await fetchArtClassPosts();

}


// ------------------------------------
// View comments
// ------------------------------------

async function viewArtClassComments(postId) {

  const post =
    artClassPosts.find(
      item => item.id === postId
    );

  if (!post) return;


  const {
    data: comments,
    error
  } =
    await supabaseClient
      .from("art_class_comments")
      .select("*")
      .eq("post_id", postId)
      .order(
        "created_at",
        {
          ascending:false
        }
      );


  if (error) {

    alert(
      "Could not load comments:\n\n" +
      error.message
    );

    return;
  }


  const commentList =
    comments || [];


  if (commentList.length === 0) {

    alert(
      `"${post.title}" has no comments yet.`
    );

    return;
  }


  const commentText =
    commentList
      .map(
        (comment, index) =>
          `${index + 1}. ${comment.name || "Anonymous"}\n` +
          `${comment.comment || ""}\n` +
          `${
            comment.created_at
              ? new Date(
                  comment.created_at
                ).toLocaleString()
              : ""
          }`
      )
      .join("\n\n");


  alert(
    `COMMENTS — ${post.title}\n\n` +
    commentText
  );

}


// ------------------------------------
// Delete Art Class post
// ------------------------------------

async function deleteArtClassPost(postId) {

  const post =
    artClassPosts.find(
      item => item.id === postId
    );

  if (!post) return;


  const confirmed =
    confirm(
      "DELETE ART CLASS POST?\n\n" +
      `Title: ${post.title || "Untitled"}\n\n` +
      "This will permanently delete the post.\n" +
      "Its likes and comments will also be deleted.\n\n" +
      "This cannot be undone."
    );


  if (!confirmed) return;


  try {

    // Delete comments

    const {
      error: commentsError
    } =
      await supabaseClient
        .from("art_class_comments")
        .delete()
        .eq("post_id", postId);


    if (commentsError) {

      throw new Error(
        "Could not delete comments:\n\n" +
        commentsError.message
      );

    }


    // Delete likes

    const {
      error: likesError
    } =
      await supabaseClient
        .from("art_class_likes")
        .delete()
        .eq("post_id", postId);


    if (likesError) {

      throw new Error(
        "Could not delete likes:\n\n" +
        likesError.message
      );

    }


    // Delete post

    const {
      error: postError
    } =
      await supabaseClient
        .from("art_class_posts")
        .delete()
        .eq("id", postId);


    if (postError) {

      throw new Error(
        "Could not delete post:\n\n" +
        postError.message
      );

    }


    // Delete storage image

    if (post.image_url) {

      try {

        const marker =
          "/storage/v1/object/public/art-class/";

        const markerIndex =
          post.image_url.indexOf(marker);


        if (markerIndex !== -1) {

          const filePath =
            decodeURIComponent(
              post.image_url.substring(
                markerIndex + marker.length
              )
            );


          if (filePath) {

            await supabaseClient
              .storage
              .from("art-class")
              .remove([
                filePath
              ]);

          }

        }

      } catch (storageError) {

        console.warn(
          "Could not remove Art Class image:",
          storageError
        );

      }

    }


    alert(
      "Art Class post deleted successfully."
    );


    await fetchArtClassPosts();


  } catch (error) {

    console.error(
      "Delete Art Class post error:",
      error
    );

    alert(
      "Could not delete Art Class post:\n\n" +
      error.message
    );

  }

}


// ------------------------------------
// Reset form
// ------------------------------------

function formResetArtClass() {

  const form =
    document.getElementById(
      "artClassPostForm"
    );

  if (form) {
    form.reset();
  }


  const published =
    document.getElementById(
      "artClassPublished"
    );

  if (published) {
    published.checked = true;
  }


  const preview =
    document.getElementById(
      "artClassImagePreview"
    );

  if (preview) {

    preview.src = "";
    preview.style.display =
      "none";

  }

}


// ------------------------------------
// Form message
// ------------------------------------

function showArtClassMessage(
  message,
  type
) {

  const box =
    document.getElementById(
      "artClassFormMessage"
    );

  if (!box) {

    alert(message);
    return;

  }


  box.textContent =
    message;

  box.style.display =
    "block";


  if (type === "success") {

    box.style.background =
      "#eaf7ee";

    box.style.color =
      "#176b35";

  } else {

    box.style.background =
      "#fff0f0";

    box.style.color =
      "#b00020";

  }

}
