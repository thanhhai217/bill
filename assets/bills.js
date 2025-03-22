// assets/bills.js

// Hàm kiểm tra phiên người dùng
async function checkSession() {
  // Lấy thông tin từ localStorage
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');
  const loginTimestamp = localStorage.getItem('login_timestamp');

  // Kiểm tra xem các giá trị cần thiết có tồn tại không
  if (!sessionToken || !userEmail || !loginTimestamp) {
    console.log('Missing session token, email, or login timestamp. Redirecting to login...');
    window.location.href = '/index.html';
    return false;
  }

  // Kiểm tra thời gian hết hạn (1 tháng = 30 ngày = 30 * 24 * 60 * 60 * 1000 milliseconds)
  const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
  const currentTime = Date.now();
  const timeSinceLogin = currentTime - parseInt(loginTimestamp, 10);

  if (timeSinceLogin > oneMonthInMs) {
    console.log('Session expired (over 1 month). Redirecting to login...');
    localStorage.clear(); // Xóa localStorage để yêu cầu đăng nhập lại
    window.location.href = '/index.html';
    return false;
  }

  try {
    // Gọi API verify-session để kiểm tra phiên
    const response = await fetch('https://n8n.thanhhai217.com/webhook/verify-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_token: sessionToken,
        email: userEmail,
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      console.log('Session verified successfully');
      return true; // Phiên hợp lệ, tiếp tục tải dữ liệu
    } else {
      console.log('Session verification failed:', data.message);
      localStorage.clear(); // Xóa localStorage nếu token không hợp lệ
      window.location.href = '/index.html'; // Chuyển hướng về trang đăng nhập
      return false;
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    alert('Lỗi kết nối server. Vui lòng thử lại sau.');
    return false;
  }
}

// Hàm tải danh sách hóa đơn (giả lập - bạn có thể thay thế bằng API thật)
async function fetchBills() {
  // Giả lập dữ liệu hóa đơn, bạn có thể thay bằng API thực tế
  const bills = [
    { id: 1, description: 'Hóa đơn 1', amount: 100, date: '2025-03-22' },
    { id: 2, description: 'Hóa đơn 2', amount: 200, date: '2025-03-23' },
  ];

  const billList = document.getElementById('bill-list');
  if (!billList) {
    console.error('Element with ID "bill-list" not found.');
    return;
  }

  billList.innerHTML = ''; // Xóa nội dung cũ

  bills.forEach(bill => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${bill.id}</td>
      <td>${bill.description}</td>
      <td>${bill.amount}</td>
      <td>${bill.date}</td>
    `;
    billList.appendChild(row);
  });
}

// Hàm đăng xuất
function logout() {
  localStorage.clear(); // Xóa localStorage khi đăng xuất
  window.location.href = '/index.html'; // Chuyển hướng về trang đăng nhập
}

// Khởi chạy khi trang dashboard.html được tải
document.addEventListener('DOMContentLoaded', async () => {
  // Kiểm tra phiên trước khi làm bất kỳ việc gì
  const isSessionValid = await checkSession();

  if (isSessionValid) {
    // Nếu phiên hợp lệ, tải danh sách hóa đơn
    await fetchBills();
  }

  // Gắn sự kiện cho nút đăng xuất (nếu có)
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
});