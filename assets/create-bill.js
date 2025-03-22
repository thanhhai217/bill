// assets/create-bill.js

// Khi DOM sẵn sàng
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-bill-form");
  const totalInput = document.getElementById("total-amount");
  const purposeInput = document.getElementById("purpose");
  const dateInput = document.getElementById("bill-date");
  const payerSelect = document.getElementById("payer");
  const participantsCheckboxes = document.querySelectorAll(".participant-checkbox");
  const receiptInput = document.getElementById("receipt");
  const qrInput = document.getElementById("qr");
  const messageBox = document.getElementById("message");

  // Helper hiển thị thông báo
  function showMessage(msg, type = "info") {
    messageBox.textContent = msg;
    messageBox.style.color = type === "error" ? "red" : "green";
  }

  // Gửi dữ liệu khi submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const total = parseInt(totalInput.value.replace(/\D/g, ""), 10);
    const purpose = purposeInput.value.trim();
    const date = dateInput.value;
    const payer = payerSelect.value;
    const receiptFile = receiptInput.files[0] || null;
    const qrFile = qrInput.files[0] || null;

    const participants = Array.from(participantsCheckboxes)
      .filter((cb) => cb.checked)
      .map((cb) => {
        return {
          email: cb.value,
          amount: parseInt(cb.dataset.amount || 0, 10),
        };
      });

    if (!total || !purpose || !date || !payer || participants.length === 0) {
      return showMessage("Vui lòng nhập đầy đủ thông tin", "error");
    }

    const formData = new FormData();
    formData.append("total", total);
    formData.append("purpose", purpose);
    formData.append("date", date);
    formData.append("payer", payer);
    formData.append("participants", JSON.stringify(participants));
    if (receiptFile) formData.append("receipt", receiptFile);
    if (qrFile) formData.append("qr", qrFile);

    try {
      const res = await fetch("https://n8n.thanhhai217.com/webhook/create-bill", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {
        showMessage("Tạo hóa đơn thành công!");
        setTimeout(() => {
          window.location.href = `bill-details.html?id=${data.billId}`;
        }, 1000);
      } else {
        showMessage(data.message || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Lỗi khi tạo hóa đơn", "error");
    }
  });
});