// assets/auth.js

function checkAuth() {
  const email = localStorage.getItem("user_email");

  if (!email) {
    console.warn("Chưa đăng nhập, chuyển về trang login.");

    // Tự động tính lại đường dẫn
    const currentPath = window.location.pathname;
    const isInPages = currentPath.includes("/pages/");
    const redirectTo = isInPages ? "../index.html" : "index.html";

    window.location.href = redirectTo;
  } else {
    console.log("Đã đăng nhập:", email);

    const emailSpan = document.getElementById("user-email");
    if (emailSpan) {
      emailSpan.textContent = email;
    }
  }
}
