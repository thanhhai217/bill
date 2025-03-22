// assets/auth.js
async function checkAuth() {
  const email = localStorage.getItem("user_email");
  const sessionToken = localStorage.getItem("session_token");
  const loginTimestamp = localStorage.getItem("login_timestamp");

  // Nếu thiếu thông tin, chuyển về login
  if (!email || !sessionToken) {
    redirectToLogin();
    return;
  }

  // Kiểm tra thời gian hết hạn (1 tháng)
  const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
  const currentTime = Date.now();
  if (currentTime - loginTimestamp > oneMonthInMs) {
    localStorage.clear();
    redirectToLogin();
    return;
  }

  // Kiểm tra session token từ server
  try {
    const res = await fetch("https://n8n.thanhhai217.com/webhook/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, session_token: sessionToken })
    });
    const data = await res.json();

    if (data.status === "success") {
      console.log("Phiên hợp lệ:", email);
      const emailSpan = document.getElementById("user-email");
      if (emailSpan) emailSpan.textContent = email;
    } else {
      console.warn("Phiên không hợp lệ:", data.message);
      localStorage.clear();
      redirectToLogin();
    }
  } catch (err) {
    console.error("Lỗi khi kiểm tra phiên:", err);
    localStorage.clear();
    redirectToLogin();
  }
}

function redirectToLogin() {
  console.warn("Chưa đăng nhập hoặc phiên không hợp lệ, chuyển về trang login.");
  const currentPath = window.location.pathname;
  const isInPages = currentPath.includes("/pages/");
  const redirectTo = isInPages ? "../index.html" : "index.html";
  window.location.href = redirectTo;
}

// Gọi checkAuth khi tải trang (nếu cần)
// document.addEventListener("DOMContentLoaded", checkAuth);