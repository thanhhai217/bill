document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const pinForm = document.getElementById("pin-form");
    const emailInput = document.getElementById("email");
    const pinInput = document.getElementById("pin");
    const message = document.getElementById("message");

    const API_BASE_URL = "https://n8n.thanhhai217.com/webhook";

    // 🟢 Xử lý khi user nhập email
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            message.textContent = "Vui lòng nhập email hợp lệ!";
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/create-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                message.textContent = "Mã PIN đã được gửi đến email của bạn!";
                loginForm.style.display = "none";
                pinForm.style.display = "block";
            } else {
                message.textContent = data.error || "Có lỗi xảy ra!";
            }
        } catch (error) {
            message.textContent = "Không thể kết nối đến server!";
        }
    });

    // 🔑 Xử lý khi user nhập mã PIN
    pinForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const pin = pinInput.value.trim();
        const email = emailInput.value.trim();

        if (!pin) {
            message.textContent = "Vui lòng nhập mã PIN!";
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/verify-pin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, pin }),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("userEmail", email); // Lưu trạng thái đăng nhập
                window.location.href = "dashboard.html"; // Chuyển hướng đến trang chính
            } else {
                message.textContent = data.error || "Mã PIN không đúng!";
            }
        } catch (error) {
            message.textContent = "Không thể kết nối đến server!";
        }
    });

    // 🛠️ Kiểm tra nếu user đã đăng nhập trước đó
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
        window.location.href = "dashboard.html"; // Nếu đã đăng nhập, chuyển đến dashboard
    }
});
