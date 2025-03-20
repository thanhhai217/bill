document.addEventListener("DOMContentLoaded", async function () {
    const userEmail = localStorage.getItem("userEmail");
    const userEmailSpan = document.getElementById("user-email");
    const billsContainer = document.getElementById("bills-container");
    const createBillBtn = document.getElementById("create-bill-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (!userEmail) {
        window.location.href = "index.html"; // Chuyển hướng nếu chưa đăng nhập
        return;
    }

    userEmailSpan.textContent = userEmail;

    // 🟢 Lấy danh sách hóa đơn từ API
    async function loadBills() {
        try {
            const billsData = await getUserBills(userEmail);
            billsContainer.innerHTML = ""; // Xóa nội dung cũ

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
            billsContainer.innerHTML = "<p>Lỗi khi tải hóa đơn.</p>";
        }
    }

    // 📝 Xem chi tiết bill
    window.viewBill = function (billId) {
        window.location.href = `bill-details.html?bill_id=${billId}`;
    };

    // ➕ Nút tạo bill
    createBillBtn.addEventListener("click", function () {
        window.location.href = "create-bill.html";
    });

    // 🚪 Nút đăng xuất
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("userEmail");
        window.location.href = "index.html";
    });

    // 🚀 Load danh sách bill khi trang load
    loadBills();
});
