// assets/script.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const switchToSignup = document.getElementById("switch-to-signup");
  const switchToLogin = document.getElementById("switch-to-login");
  const btnSend = document.getElementById("btn-send");
  const btnLogin = document.getElementById("btn-login");
  const messageBox = document.getElementById("message");

  // Helper hiển thị thông báo
  function showMessage(msg, type = "info") {
    messageBox.textContent = msg;
    messageBox.style.color = type === "error" ? "red" : "green";
  }

  // Chuyển form
  switchToSignup?.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    messageBox.textContent = "";
  });

  switchToLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    messageBox.textContent = "";
  });

  // Xử lý đăng ký
  btnSend?.addEventListener("click", async () => {
    const email = document.getElementById("signup-email").value.trim();
    if (!email) return showMessage("Vui lòng nhập email", "error");

    try {
      const res = await fetch("https://n8n.thanhhai217.com/webhook/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      console.log("Create-user response:", data);

      if (data.status === "error" && data.message === "Email has been used") {
        showMessage("Email đã được sử dụng. Vui lòng đăng nhập!", "error");
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        document.getElementById("email").value = email;
      } else {
        showMessage("Mã PIN đã được gửi đến email của bạn!");
        signupForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        document.getElementById("email").value = email;
      }
    } catch (err) {
      console.error("Error during signup:", err);
      showMessage("Có lỗi xảy ra khi gửi email", "error");
    }
  });

  // Xử lý đăng nhập
  btnLogin?.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const pin = document.getElementById("pin").value.trim();
    if (!email || !pin) return showMessage("Vui lòng nhập đầy đủ thông tin", "error");

    try {
      const res = await fetch("https://n8n.thanhhai217.com/webhook/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin })
      });

      const data = await res.json();
      console.log("Verify-pin response:", data);

      if (data.status === "success") {
        if (!data.session_token) {
          console.error("Session token missing in verify-pin response");
          showMessage("Lỗi: Không nhận được session token từ server", "error");
          return;
        }

        // Lưu thông tin phiên vào localStorage
        localStorage.setItem("user_email", email);
        localStorage.setItem("session_token", data.session_token);
        localStorage.setItem("login_timestamp", Date.now().toString());
        console.log("Saved to localStorage:", {
          user_email: localStorage.getItem("user_email"),
          session_token: localStorage.getItem("session_token"),
          login_timestamp: localStorage.getItem("login_timestamp")
        });

        // Chuyển hướng tới dashboard
        window.location.href = "pages/dashboard.html";
      } else {
        showMessage("Mã PIN không đúng hoặc hết hạn!", "error");
      }
    } catch (err) {
      console.error("Error during login:", err);
      showMessage("Có lỗi xảy ra khi đăng nhập", "error");
    }
  });
});