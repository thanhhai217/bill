// assets/create-bill.js

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

// Hàm lấy danh sách người dùng từ webhook get-user
async function fetchMembers() {
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');

  try {
    const response = await fetch('https://n8n.thanhhai217.com/webhook/get-user', {
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

    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    document.getElementById('message').textContent = 'Lỗi khi lấy danh sách người dùng. Vui lòng thử lại sau.';
    return [];
  }
}

// Hàm điền dữ liệu vào select box và modal
async function populateSelectBoxes() {
  const members = await fetchMembers();

  // Điền danh sách người trả (paid-by)
  const paidBySelect = document.getElementById('paid-by');
  paidBySelect.innerHTML = ''; // Xóa các option cũ
  members.forEach(member => {
    const option = document.createElement('option');
    option.value = member.email;
    option.textContent = member.name;
    paidBySelect.appendChild(option);
  });

  // Điền danh sách thành viên vào modal
  const membersList = document.getElementById('members-list');
  membersList.innerHTML = '';

  const totalAmountInput = document.getElementById('total-amount');
  const totalAmount = parseFloat(totalAmountInput.value) || 0;
  const memberCount = members.length;
  const amountPerMember = memberCount > 0 ? (totalAmount / memberCount).toFixed(2) : 0;

  members.forEach(member => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.marginBottom = '10px';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = member.email;
    checkbox.checked = true;

    const label = document.createElement('span');
    label.textContent = member.name;
    label.style.marginLeft = '10px';

    const amount = document.createElement('span');
    amount.textContent = `${amountPerMember}đ`;
    amount.style.marginLeft = 'auto';

    div.appendChild(checkbox);
    div.appendChild(label);
    div.appendChild(amount);
    membersList.appendChild(div);
  });

  // Cập nhật số tiền chia đều khi tổng số tiền thay đổi
  totalAmountInput.addEventListener('input', () => {
    const newTotalAmount = parseFloat(totalAmountInput.value) || 0;
    const newAmountPerMember = memberCount > 0 ? (newTotalAmount / memberCount).toFixed(2) : 0;
    document.querySelectorAll('#members-list div span:last-child').forEach(span => {
      span.textContent = `${newAmountPerMember}đ`;
    });
  });
}

// Xử lý modal
const membersModal = document.getElementById('members-modal');
const openMembersModalBtn = document.getElementById('open-members-modal');
const closeMembersModalBtn = document.getElementById('close-members-modal');
const saveMembersBtn = document.getElementById('save-members');

openMembersModalBtn.addEventListener('click', () => {
  membersModal.classList.remove('hidden');
});

closeMembersModalBtn.addEventListener('click', () => {
  membersModal.classList.add('hidden');
});

saveMembersBtn.addEventListener('click', () => {
  membersModal.classList.add('hidden');
});

// Xử lý sự kiện khi nhấn nút "Thêm chi tiêu"
document.getElementById('submit-bill').addEventListener('click', async () => {
  const isSessionValid = await checkSession();
  if (!isSessionValid) return;

  const totalAmount = document.getElementById('total-amount').value;
  const purpose = document.getElementById('purpose').value;
  const date = document.getElementById('date').value;
  const paidBy = document.getElementById('paid-by').value;
  const members = Array.from(document.querySelectorAll('#members-list input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
  const receipt = document.getElementById('receipt').files[0];
  const qr = document.getElementById('qr').files[0];

  if (!totalAmount || !purpose || !date || !paidBy || members.length === 0) {
    document.getElementById('message').textContent = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
    return;
  }

  const formData = new FormData();
  formData.append('total_amount', totalAmount);
  formData.append('purpose', purpose);
  formData.append('date', date);
  formData.append('paid_by', paidBy);
  formData.append('members', JSON.stringify(members));
  if (receipt) formData.append('receipt', receipt);
  if (qr) formData.append('qr', qr);

  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');
  formData.append('session_token', sessionToken);
  formData.append('email', userEmail);

  try {
    const response = await fetch('https://n8n.thanhhai217.com/webhook/create-bill', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.status === 'success') {
      document.getElementById('message').textContent = 'Thêm chi tiêu thành công!';
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    } else {
      document.getElementById('message').textContent = `Lỗi: ${result.message}`;
    }
  } catch (error) {
    console.error('Error submitting bill:', error);
    document.getElementById('message').textContent = 'Lỗi kết nối server. Vui lòng thử lại sau.';
  }
});

// Khởi chạy khi trang được tải
document.addEventListener('DOMContentLoaded', async () => {
  const isSessionValid = await checkSession();
  if (isSessionValid) {
    await populateSelectBoxes();
  }

  flatpickr('#date', {
    dateFormat: 'd/m/Y',
    defaultDate: 'today',
  });
});