// Sudharshan Bank - Frontend Logic
// --------------------------------
const API_BASE = "http://127.0.0.1:8000"; // Backend URL

// Cached DOM helpers
const $ = (id) => document.getElementById(id);

// Sections
const loginSection = $("loginSection");
const registerSection = $("registerSection");
const homeSection = $("homeSection");

// State
let currentAccount = null;
let currentUser = null;

// Utility: Switch visible section
function show(section) {
  [loginSection, registerSection, homeSection].forEach((s) =>
    s.classList.add("hidden")
  );
  section.classList.remove("hidden");
}

// Utility: Display alert messages
function notify(msg, isError = false) {
  alert((isError ? "⚠️ " : "✅ ") + msg);
}

// ------------------------------
// LOGIN & REGISTER
// ------------------------------
$("showRegisterBtn").onclick = () => show(registerSection);
$("backToLoginBtn").onclick = () => show(loginSection);

// Register
$("registerBtn").onclick = async () => {
  const acct = $("regAcct").value.trim();
  const name = $("regName").value.trim();
  const age = Number($("regAge").value);
  const gender = $("regGender").value;
  const initial_balance = Number($("regBalance").value) || 0;

  if (acct.length !== 10 || isNaN(acct)) {
    notify("Account number must be exactly 10 digits.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_number: acct,
        name,
        age,
        gender,
        initial_balance,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message);
    notify(`Account created successfully for ${name}!`);
    show(loginSection);
  } catch (err) {
    notify("Server error: " + err.message, true);
  }
};

// Login
$("loginBtn").onclick = async () => {
  const acct = $("loginAcct").value.trim();
  if (acct.length !== 10 || isNaN(acct)) {
    notify("Enter a valid 10-digit account number.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_number: acct }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message);
    currentAccount = acct;
    currentUser = data.user;
    $("homeName").textContent = currentUser.name;
    updateBalanceDisplay(currentUser.balance);
    await loadTransactions();
    show(homeSection);
  } catch (err) {
    notify("⚠️ Login failed: " + err.message, true);
  }
};

// ------------------------------
// HOME PAGE FUNCTIONS
// ------------------------------
function updateBalanceDisplay(balance) {
  $("balanceDisplay").textContent = balance.toFixed(2);
}

// Deposit / Withdraw
$("txnBtn").onclick = async () => {
  const amount = Number($("txnAmount").value);
  const kind = $("txnKind").value;
  if (isNaN(amount) || amount <= 0) {
    notify("Please enter a valid amount.", true);
    return;
  }

  const endpoint = kind === "credit" ? "deposit" : "withdraw";
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_number: currentAccount,
        amount,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message);
    notify(`${kind === "credit" ? "Deposited" : "Withdrawn"} ₹${amount}`);
    await refreshBalance();
    await loadTransactions();
  } catch (err) {
    notify("Server error: " + err.message, true);
  }
};

// Refresh Balance
$("refreshBtn").onclick = async () => {
  await refreshBalance();
};

async function refreshBalance() {
  try {
    const res = await fetch(`${API_BASE}/balance/${currentAccount}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message);
    updateBalanceDisplay(data.balance);
  } catch (err) {
    notify("⚠️ Could not fetch balance: " + err.message, true);
  }
}

// Transfer (NEFT/RTGS)
$("transferBtn").onclick = async () => {
  const toAccount = $("toAccount").value.trim();
  const amount = Number($("transferAmount").value);
  const mode = $("transferMode").value;

  if (toAccount.length !== 10 || isNaN(toAccount)) {
    notify("Enter a valid 10-digit destination account number.", true);
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    notify("Enter a valid transfer amount.", true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_account: currentAccount,
        to_account: toAccount,
        amount,
        mode,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message);
    notify(`✅ ${mode.toUpperCase()} transfer successful!`);
    await refreshBalance();
    await loadTransactions();
  } catch (err) {
    notify("⚠️ Transfer failed: " + err.message, true);
  }
};

// Load Transactions
async function loadTransactions() {
  try {
    const res = await fetch(`${API_BASE}/transactions/${currentAccount}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message);

    const list = $("txList");
    list.innerHTML = "";
    data.transactions.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = `${t.type.toUpperCase()} - ₹${t.amount} (${t.mode || "self"})`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Could not load transactions:", err);
  }
}

// Logout
$("exitBtn").onclick = () => {
  notify("Thank you for banking with Sudharshan Bank! 🙏");
  currentAccount = null;
  currentUser = null;
  show(loginSection);
};
