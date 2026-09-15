// Ndambuki Art Lab — Admin Dashboard

let commissionRequests = [];

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

    await loadCommissionRequests();

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

  container.innerHTML = "";
  container.appendChild(loginBox);

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

  if (loginBox) {
    loginBox.style.display = "block";
  }
}


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

  console.log(
    "Commission requests loaded:",
    commissionRequests
  );

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

  document.getElementById("totalRequests").textContent = total;

  document.getElementById("newRequests").textContent =
    newRequests;

  document.getElementById("progressRequests").textContent =
    inProgress;

  document.getElementById("completedRequests").textContent =
    completed;
}


// ------------------------------------
// Render requests
// ------------------------------------

function renderRequests() {

  const table = document.getElementById("requestsTable");
  const body = document.getElementById("requestsBody");
  const emptyState = document.getElementById("emptyState");

  if (!body) return;

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


// ------------------------------------
// Refresh button
// ------------------------------------

const refreshBtn = document.getElementById("refreshBtn");

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    await loadCommissionRequests();
  });
}


// ------------------------------------
// Logout
// ------------------------------------

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    window.location.reload();

  });

}


// ------------------------------------
// Error message
// ------------------------------------

function showError(message) {

  const errorBox =
    document.getElementById("errorMessage");

  if (!errorBox) return;

  errorBox.textContent = message;
  errorBox.style.display = "block";
}


// ------------------------------------
// Security helper
// ------------------------------------

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
