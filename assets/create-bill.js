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
    console.log('Danh sách người dùng từ webhook get-user:', users);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    document.getElementById('message').textContent = 'Lỗi khi lấy danh sách người dùng. Vui lòng thử lại sau.';
    return [];
  }
}

// Hàm điền dữ liệu vào select box và modal
let membersWithAmount = []; // Lưu danh sách thành viên với amount_due

async function populateSelectBoxes() {
  const members = await fetchMembers();
  console.log('Members sau khi fetch:', members);

  if (!Array.isArray(members) || members.length === 0) {
    console.error('Không có dữ liệu người dùng để hiển thị trong dropdown');
    document.getElementById('message').textContent = 'Không có người dùng nào để hiển thị.';
    return;
  }

  // Điền danh sách người trả (paid-by)
  const paidBySelect = document.getElementById('paid-by');
  paidBySelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Chọn người trả';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  paidBySelect.appendChild(defaultOption);

  members.forEach(member => {
    const option = document.createElement('option');
    option.value = member.email;
    option.textContent = member.email.split('@')[0];
    paidBySelect.appendChild(option);
  });

  // Điền danh sách thành viên vào modal
  const membersList = document.getElementById('members-list');
  membersList.innerHTML = '';

  const totalAmountInput = document.getElementById('total-amount');
  const totalAmount = parseFloat(totalAmountInput.value) || 0;
  const memberCount = members.length;
  const amountPerMember = memberCount > 0 ? Math.round(totalAmount / memberCount) : 0; // Làm tròn đến số nguyên

  // Lưu danh sách thành viên với amount_due
  membersWithAmount = members.map(member => ({
    email: member.email,
    amount_due: amountPerMember
  }));

  membersWithAmount.forEach(member => {
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
    label.textContent = member.email.split('@')[0];
    label.style.marginLeft = '10px';

    const amount = document.createElement('span');
    amount.textContent = `${member.amount_due.toLocaleString('vi-VN')}đ`; // Định dạng số tiền
    amount.style.marginLeft = 'auto';

    div.appendChild(checkbox);
    div.appendChild(label);
    div.appendChild(amount);
    membersList.appendChild(div);
  });

  totalAmountInput.addEventListener('input', () => {
    const newTotalAmount = parseFloat(totalAmountInput.value) || 0;
    const newAmountPerMember = memberCount > 0 ? Math.round(newTotalAmount / memberCount) : 0;

    // Cập nhật lại membersWithAmount
    membersWithAmount = members.map(member => ({
      email: member.email,
      amount_due: newAmountPerMember
    }));

    document.querySelectorAll('#members-list div span:last-child').forEach((span, index) => {
      span.textContent = `${membersWithAmount[index].amount_due.toLocaleString('vi-VN')}đ`;
    });
  });
}

// Khởi tạo Flatpickr và lưu instance
const datePicker = flatpickr('#date', {
  dateFormat: 'd/m/Y',
  defaultDate: 'today',
});

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
  const submitButton = document.getElementById('submit-bill');
  submitButton.disabled = true; // Vô hiệu hóa nút

  const isSessionValid = await checkSession();
  if (!isSessionValid) {
    submitButton.disabled = false;
    return;
  }

  const totalAmount = document.getElementById('total-amount').value;
  const purpose = document.getElementById('purpose').value;
  const selectedDate = datePicker.selectedDates[0];
  const paidBy = document.getElementById('paid-by').value;
  const selectedMembers = Array.from(document.querySelectorAll('#members-list input[type="checkbox"]:checked')).map(checkbox => {
    const member = membersWithAmount.find(m => m.email === checkbox.value);
    return {
      email: member.email,
      amount_due: member.amount_due
    };
  });
  const receipt = document.getElementById('receipt').files[0];
  const qr = document.getElementById('qr').files[0];

  if (!totalAmount || !purpose || !selectedDate || !paidBy || selectedMembers.length === 0) {
    document.getElementById('message').textContent = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
    submitButton.disabled = false;
    return;
  }

  const dateISOString = selectedDate.toISOString();
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');

  const formData = new FormData();
  formData.append('total_amount', totalAmount);
  formData.append('purpose', purpose);
  formData.append('date', dateISOString);
  formData.append('paid_by', paidBy);
  formData.append('members', JSON.stringify(selectedMembers));
  formData.append('creator_email', userEmail);
  formData.append('account_number', '');
  formData.append('bank_name', '');
  formData.append('receipt', receipt || '');
  formData.append('qr', qr || '');
  formData.append('session_token', sessionToken);
  formData.append('email', userEmail);

  try {
    const response = await fetch('https://n8n.thanhhai217.com/webhook/create-bill', {
      method: 'POST',
      body: formData,
    });
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('Content-Type'));
    const result = await response.json();
    console.log('Parsed result:', result);
    console.log('Result status (raw):', result.status);
    console.log('Result status (trimmed):', result.status.trim());

    const status = result.status ? result.status.trim() : '';
    if (result && status === 'success') {
      console.log('Processing success response:', result);
      document.getElementById('message').textContent = `Thêm chi tiêu thành công! Hóa đơn ID: ${result.bill_id}`;
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
    } else {
      console.log('Processing error response:', result);
      document.getElementById('message').textContent = `Lỗi: ${result?.message || 'Không có thông báo lỗi'}`;
      submitButton.disabled = false;
    }
  } catch (error) {
    console.error('Error submitting bill:', error);
    document.getElementById('message').textContent = 'Lỗi kết nối server. Vui lòng thử lại sau.';
    submitButton.disabled = false;
  }
});

// Khởi chạy khi trang được tải
document.addEventListener('DOMContentLoaded', async () => {
  const isSessionValid = await checkSession();
  if (isSessionValid) {
    await populateSelectBoxes();
  }
});