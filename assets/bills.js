// assets/bills.js

// Hàm định dạng số tiền với dấu phân cách hàng nghìn
function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
}

// Hàm kiểm tra phiên người dùng
async function checkSession() {
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');
  const loginTimestamp = localStorage.getItem('login_timestamp');

  if (!sessionToken || !userEmail || !loginTimestamp) {
    console.log('Missing session token, email, or login timestamp. Redirecting to login...');
    window.location.href = '/index.html';
    return false;
  }

  const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
  const currentTime = Date.now();
  const timeSinceLogin = currentTime - parseInt(loginTimestamp, 10);

  if (timeSinceLogin > oneMonthInMs) {
    console.log('Session expired (over 1 month). Redirecting to login...');
    localStorage.clear();
    window.location.href = '/index.html';
    return false;
  }

  try {
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
      // Cập nhật phần chào với email
      const greetingMessage = document.getElementById('greeting-message');
      if (greetingMessage) {
        greetingMessage.textContent = `Chào, ${userEmail.split('@')[0]}!`;
      } else {
        console.error('Greeting message element not found.');
      }
      return true;
    } else {
      console.log('Session verification failed:', data.message);
      localStorage.clear();
      window.location.href = '/index.html';
      return false;
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    alert('Lỗi kết nối server. Vui lòng thử lại sau.');
    return false;
  }
}

// Hàm tải danh sách hóa đơn
async function fetchBills() {
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');

  try {
    const response = await fetch('https://n8n.thanhhai217.com/webhook/check-bill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_token: sessionToken,
        email: userEmail,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const bills = await response.json();

    // Kiểm tra định dạng dữ liệu trả về
    if (!Array.isArray(bills)) {
      console.error('Unexpected data format:', bills);
      throw new Error('Dữ liệu hóa đơn không đúng định dạng (phải là một mảng).');
    }

    // Sắp xếp danh sách hóa đơn theo date giảm dần (mới nhất trước)
    bills.sort((a, b) => new Date(b.date) - new Date(a.date));

    const billList = document.getElementById('bill-list');
    const billTable = document.getElementById('bill-table');
    const billListMobile = document.getElementById('bill-list-mobile');
    const noBillsMessage = document.getElementById('no-bills-message');
    const loadingMessage = document.getElementById('loading-message');

    if (!billList || !billTable || !billListMobile || !noBillsMessage || !loadingMessage) {
      console.error('Required elements not found: bill-list, bill-table, bill-list-mobile, no-bills-message, or loading-message.');
      return;
    }

    // Ẩn dòng chữ "Đang tải danh sách hóa đơn..." sau khi dữ liệu được tải xong
    loadingMessage.style.display = 'none';

    billList.innerHTML = ''; // Xóa nội dung cũ (desktop)
    billListMobile.innerHTML = ''; // Xóa nội dung cũ (mobile)

    // Kiểm tra nếu không có hóa đơn hoặc không có hóa đơn hợp lệ
    const validBills = bills.filter(bill => bill.id !== null && bill.id !== undefined);
    if (validBills.length === 0) {
      // Ẩn bảng và hiển thị thông báo
      billTable.style.display = 'none';
      billListMobile.style.display = 'none';
      noBillsMessage.style.display = 'block';
      return;
    }

    // Hiển thị bảng (desktop) và danh sách (mobile), ẩn thông báo
    billTable.style.display = 'table'; // Hiển thị bảng trên desktop
    billListMobile.style.display = 'block'; // Hiển thị danh sách trên mobile
    noBillsMessage.style.display = 'none';

    // Hiển thị danh sách hóa đơn trên desktop (bảng)
    validBills.forEach(bill => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${bill.id || 'N/A'}</td>
        <td>${bill.purpose || 'Không có mô tả'}</td>
        <td>${formatCurrency(bill.total_amount || 0)}</td>
        <td>${bill.date ? new Date(bill.date).toLocaleDateString('vi-VN') : 'N/A'}</td>
        <td><span class="status ${bill.status === 'Chưa thanh toán' ? 'unpaid' : 'paid'}">${bill.status || 'N/A'}</span></td>
      `;
      // Chuyển hướng đến bill-details.html (đã sửa đường dẫn)
      row.addEventListener('click', () => {
        window.location.href = `bill-details.html?id=${bill.id}`;
      });
      billList.appendChild(row);
    });

    // Hiển thị danh sách hóa đơn trên mobile (dạng danh sách)
    validBills.forEach(bill => {
      const billItem = document.createElement('div');
      billItem.classList.add('bill-item');
      billItem.innerHTML = `
        <div><strong>Mô tả:</strong> ${bill.purpose || 'Không có mô tả'}</div>
        <div><strong>Số tiền:</strong> ${formatCurrency(bill.total_amount || 0)}</div>
        <div><strong>Ngày:</strong> ${bill.date ? new Date(bill.date).toLocaleDateString('vi-VN') : 'N/A'}</div>
        <div><strong>Trạng thái:</strong> <span class="status ${bill.status === 'Chưa thanh toán' ? 'unpaid' : 'paid'}">${bill.status || 'N/A'}</span></div>
      `;
      // Chuyển hướng đến bill-details.html (đã sửa đường dẫn)
      billItem.addEventListener('click', () => {
        window.location.href = `bill-details.html?id=${bill.id}`;
      });
      billListMobile.appendChild(billItem);
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    const billList = document.getElementById('bill-list');
    const billTable = document.getElementById('bill-table');
    const billListMobile = document.getElementById('bill-list-mobile');
    const noBillsMessage = document.getElementById('no-bills-message');
    const loadingMessage = document.getElementById('loading-message');

    if (billList && billTable && billListMobile && noBillsMessage && loadingMessage) {
      loadingMessage.style.display = 'none';
      billList.innerHTML = '';
      billTable.style.display = 'none';
      billListMobile.style.display = 'none';
      noBillsMessage.style.display = 'block';
      noBillsMessage.textContent = `Lỗi khi tải danh sách hóa đơn: ${error.message}`;
    }
  }
}

// Hàm xử lý khi nhấn nút "Tạo Bill Mới"
function createNewBill() {
  window.location.href = 'create-bill.html';
}

// Hàm đăng xuất
function logout() {
  localStorage.clear();
  window.location.href = '/index.html';
}

// Khởi chạy khi trang dashboard.html được tải
document.addEventListener('DOMContentLoaded', () => {
  checkSession().then(isSessionValid => {
    if (isSessionValid) {
      fetchBills(); // ✅ chỉ gọi 1 lần duy nhất khi session hợp lệ

      // Gắn sự kiện click cho nút "Đăng Xuất"
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', logout);
      } else {
        console.error('Logout button not found.');
      }

      // Gắn sự kiện click cho nút "Tạo Bill Mới"
      const createBillButton = document.querySelector('.btn-add');
      if (createBillButton) {
        createBillButton.addEventListener('click', createNewBill);
      } else {
        console.error('Create bill button not found.');
      }
    }
  });
});