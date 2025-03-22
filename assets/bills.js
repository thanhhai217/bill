// assets/bills.js
document.addEventListener("DOMContentLoaded", async function () {
  const userEmail = localStorage.getItem("user_email");
  const sessionToken = localStorage.getItem("session_token");
  const loginTimestamp = localStorage.getItem("login_timestamp");
  const userEmailSpan = document.getElementById("user-email");
  const billsContainer = document.getElementById("bills-container");
  const createBillBtn = document.getElementById("create-bill-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Kiểm tra phiên đăng nhập
  const isSessionValid = await checkAuth();
  if (!isSessionValid) return;

  // Hàm kiểm tra phiên
  async function checkAuth() {
    console.log("Checking session:", { userEmail, sessionToken, loginTimestamp });

    if (!userEmail || !sessionToken) {
      console.warn("Missing email or token in localStorage");
      redirectToLogin();
      return false;
    }

    // Kiểm tra thời gian hết hạn (1 tháng)
    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
    const currentTime = Date.now();
    if (currentTime - loginTimestamp > oneMonthInMs) {
      console.warn("Session expired due to timeout");
      localStorage.clear();
      redirectToLogin();
      return false;
    }

    // Kiểm tra session token từ server
    try {
      const res = await fetch("https://n8n.thanhhai217.com/webhook/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, session_token: sessionToken })
      });
      const data = await res.json();
      console.log("Verify-session response:", data);

      if (data.status !== "success") {
        console.warn("Invalid session:", data.message);
        localStorage.clear();
        redirectToLogin();
        return false;
      }

      console.log("Session verified successfully");
      userEmailSpan.textContent = userEmail;
      return true;
    } catch (err) {
      console.error("Error verifying session:", err);
      billsContainer.innerHTML = "<p>Lỗi kết nối server. Vui lòng thử lại sau.</p>";
      return false;
    }
  }

  // Hàm chuyển hướng về login
  function redirectToLogin() {
    console.warn("Redirecting to login page...");
    window.location.href = "../index.html";
  }

  // Hàm tải danh sách hóa đơn
  async function loadBills() {
    try {
      const billsData = await getUserBills(userEmail);
      console.log("Bills data:", billsData);
      billsContainer.innerHTML = "";

      if (!billsData.bills || billsData.bills.length === 0) {
        billsContainer.innerHTML = "<p>Không có hóa đơn nào.</p>";
        return;
      }

      billsData.bills.forEach(bill => {
        const billElement = document.createElement("div");
        billElement.classList.add("bill");

        billElement.innerHTML = `
          <p><strong>${bill.purpose}</strong> - ${bill.date}</p>
          <p>Số tiền: <strong>${bill.total_amount} VND</strong></p>
          <p>Trạng thái: <span class="${bill.status === 'Đã thanh toán' ? 'paid' : 'unpaid'}">${bill.status}</span></p>
          <button onclick="viewBill(${bill.bill_id})">Xem chi tiết</button>
        `;

        billsContainer.appendChild(billElement);
      });
    } catch (error) {
      console.error("Error loading bills:", error);
      billsContainer.innerHTML = "<p>Lỗi khi tải hóa đơn.</p>";
    }
  }

  // Hàm xem chi tiết hóa đơn
  window.viewBill = function (billId) {
    window.location.href = `bill-details.html?bill_id=${billId}`;
  };

  // Nút tạo hóa đơn mới
  createBillBtn.addEventListener("click", function () {
    window.location.href = "create-bill.html";
  });

  // Nút đăng xuất
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("user_email");
    localStorage.removeItem("session_token");
    localStorage.removeItem("login_timestamp");
    window.location.href = "../index.html";
  });

  // Tải danh sách hóa đơn nếu phiên hợp lệ
  loadBills();
});