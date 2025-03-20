const API_BASE_URL = "https://n8n.thanhhai217.com/webhook";

/**
 * 🟢 Đăng ký user bằng email
 * @param {string} email - Email của người dùng
 * @returns {Promise<Object>} - Kết quả từ API
 */
async function registerUser(email) {
    return await fetch(`${API_BASE_URL}/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    }).then(res => res.json());
}

/**
 * 🔑 Xác thực user bằng mã PIN
 * @param {string} email - Email của người dùng
 * @param {string} pin - Mã PIN nhập vào
 * @returns {Promise<Object>} - Kết quả từ API
 */
async function verifyPin(email, pin) {
    return await fetch(`${API_BASE_URL}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
    }).then(res => res.json());
}

/**
 * 📋 Lấy danh sách bill của user
 * @param {string} email - Email của user đang đăng nhập
 * @returns {Promise<Object>} - Danh sách bill
 */
async function getUserBills(email) {
    return await fetch(`${API_BASE_URL}/get-bills/${email}`)
        .then(res => res.json());
}

/**
 * 📝 Tạo bill mới
 * @param {Object} billData - Thông tin bill cần tạo
 * @returns {Promise<Object>} - Kết quả từ API
 */
async function createBill(billData) {
    return await fetch(`${API_BASE_URL}/create-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
    }).then(res => res.json());
}

/**
 * ✅ Cập nhật trạng thái thanh toán
 * @param {number} billId - ID của bill
 * @param {string} email - Email của người thanh toán
 * @returns {Promise<Object>} - Kết quả từ API
 */
async function updatePayment(billId, email) {
    return await fetch(`${API_BASE_URL}/update-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_id: billId, email }),
    }).then(res => res.json());
}

/**
 * ❌ Xóa bill (Chỉ chủ bill mới được xóa)
 * @param {number} billId - ID của bill cần xóa
 * @returns {Promise<Object>} - Kết quả từ API
 */
async function deleteBill(billId) {
    return await fetch(`${API_BASE_URL}/delete-bill/${billId}`, {
        method: "DELETE",
    }).then(res => res.json());
}
