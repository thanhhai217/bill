// assets/auth.js
function checkAuth() {
  const email = localStorage.getItem("user_email");
  const sessionToken = localStorage.getItem("session_token");
  const loginTimestamp = localStorage.getItem("login_timestamp");

  // Nếu không có email hoặc token, chuyển về login
  if (!email || !sessionToken) {
    redirectToLogin();
    return;
  }

  // Kiểm tra thời gian hết hạn (1 tháng = 30 ngày)
  const oneMonthInMs = 30 * 24 * 60 * 60 * 1000; // 30 ngày tính bằng milliseconds
  const currentTime = Date.now();
  if (currentTime - loginTimestamp > oneMonthInMs) {
    localStorage.clear(); // Xóa phiên hết hạn
    redirectToLogin();
    return;
  }

  // (Tùy chọn) Kiểm tra phiên hợp lệ từ server
  verifySession(email, sessionToken).then(valid => {
    if (!valid) {
      localStorage.clear();
      redirectToLogin();
    } else {
      console.log("Đã đăng nhập:", email);
      const emailSpan = document.getElementById("user-email");
      if (emailSpan) emailSpan.textContent = email;
    }
  });
}

function redirectToLogin() {
  console.warn("Chưa đăng nhập, chuyển về trang login.");
  const currentPath = window.location.pathname;
  const isInPages = currentPath.includes("/pages/");
  const redirectTo = isInPages ? "../index.html" : "index.html";
  window.location.href = redirectTo;
}

// Hàm kiểm tra phiên từ server (thêm vào assets/api.js sau)
async function verifySession(email, sessionToken) {
  try {
    const res = await fetch("https://n8n.thanhhai217.com/webhook/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, session_token: sessionToken })
    });
    const data = await res.json();
    return data.status === "success";
  } catch (err) {
    console.error("Lỗi kiểm tra phiên:", err);
    return false;
  }
}