// ✅ File: create-bill.js - Đã nâng cấp với các tính năng thông minh chia tiền

let membersWithAmount = [];

// Kiểm tra phiên đăng nhập
async function checkSession() {
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');
  const loginTimestamp = localStorage.getItem('login_timestamp');

  if (!sessionToken || !userEmail || !loginTimestamp) {
    window.location.href = '/index.html';
    return false;
  }

  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - parseInt(loginTimestamp) > oneMonth) {
    localStorage.clear();
    window.location.href = '/index.html';
    return false;
  }

  try {
    const res = await fetch('https://n8n.thanhhai217.com/webhook/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: sessionToken, email: userEmail })
    });
    const data = await res.json();
    return data.status === 'success';
  } catch {
    alert('Lỗi kết nối server.');
    return false;
  }
}

// Lấy danh sách thành viên
async function fetchMembers() {
  const sessionToken = localStorage.getItem('session_token');
  const userEmail = localStorage.getItem('user_email');
  try {
    const res = await fetch('https://n8n.thanhhai217.com/webhook/get-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: sessionToken, email: userEmail })
    });
    return await res.json();
  } catch {
    document.getElementById('message').textContent = 'Không thể lấy danh sách người dùng.';
    return [];
  }
}

// Cập nhật số tiền chia cho từng thành viên
function updateAmounts(totalAmount) {
  const checked = membersWithAmount.filter(m => {
    const cb = document.querySelector(`input[data-email="${m.email}"]`);
    return cb?.checked;
  });
  const perPerson = checked.length > 0 ? Math.round(totalAmount / checked.length) : 0;

  membersWithAmount.forEach(member => {
    const cb = document.querySelector(`input[data-email="${member.email}"]`);
    const amountSpan = document.querySelector(`span[data-amount="${member.email}"]`);
    if (cb?.checked) {
      member.amount_due = perPerson;
      if (amountSpan) amountSpan.textContent = `${perPerson.toLocaleString('vi-VN')}đ`;
    } else {
      member.amount_due = 0;
      if (amountSpan) amountSpan.textContent = '0đ';
    }
  });

  document.getElementById('selected-count').textContent = checked.length;
}

// Tải danh sách thành viên và hiển thị trong modal
async function populateSelectBoxes() {
  const members = await fetchMembers();
  const paidBySelect = document.getElementById('paid-by');
  paidBySelect.innerHTML = '<option disabled selected>Chọn người trả</option>';
  members.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.email;
    opt.textContent = m.email.split('@')[0];
    paidBySelect.appendChild(opt);
  });

  membersWithAmount = members.map(m => ({ email: m.email, amount_due: 0 }));

  const membersList = document.getElementById('members-list');
  membersList.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
      <strong>Thành viên</strong>
      <strong>Số tiền</strong>
    </div>
  `;

  membersWithAmount.forEach(m => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.marginBottom = '8px';

    const left = document.createElement('div');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.dataset.email = m.email;

    const label = document.createElement('span');
    label.textContent = m.email.split('@')[0];
    label.style.marginLeft = '10px';

    left.appendChild(cb);
    left.appendChild(label);

    const right = document.createElement('span');
    right.dataset.amount = m.email;
    right.textContent = '0đ';

    row.appendChild(left);
    row.appendChild(right);
    membersList.appendChild(row);

    cb.addEventListener('change', () => {
      const total = parseFloat(document.getElementById('total-amount').value) || 0;
      updateAmounts(total);
    });
  });

  document.getElementById('select-all').addEventListener('click', () => {
    document.querySelectorAll('#members-list input[type="checkbox"]').forEach(cb => cb.checked = true);
    updateAmounts(parseFloat(document.getElementById('total-amount').value) || 0);
  });
  document.getElementById('unselect-all').addEventListener('click', () => {
    document.querySelectorAll('#members-list input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateAmounts(parseFloat(document.getElementById('total-amount').value) || 0);
  });

  document.getElementById('total-amount').addEventListener('input', () => {
    updateAmounts(parseFloat(document.getElementById('total-amount').value) || 0);
  });

  updateAmounts(parseFloat(document.getElementById('total-amount').value) || 0);
}

// Xử lý sự kiện khi nhấn nút "Chọn người chia hóa đơn"
document.getElementById('open-members-modal').addEventListener('click', () => {
  const modal = document.getElementById('members-modal');
  modal.classList.remove('hidden'); // Hiển thị modal
});

// Xử lý sự kiện khi nhấn nút "Hủy" trong modal
document.getElementById('close-members-modal').addEventListener('click', () => {
  const modal = document.getElementById('members-modal');
  modal.classList.add('hidden'); // Ẩn modal
});

// Xử lý sự kiện khi nhấn nút "Thêm chi tiêu"
document.getElementById('submit-bill').addEventListener('click', async () => {
  const totalAmount = document.getElementById('total-amount').value;
  const purpose = document.getElementById('purpose').value;
  const selectedDate = flatpickr.formatDate(flatpickr.parseDate(document.getElementById('date').value, 'd/m/Y'), 'Y-m-d');
  const paidBy = document.getElementById('paid-by').value;
  const accountNumber = document.getElementById('bank-account').value.trim();
  const bankName = document.getElementById('bank-name').value.trim();

  const selectedMembers = Array.from(document.querySelectorAll('#members-list input[type="checkbox"]:checked')).map(cb => {
    const member = membersWithAmount.find(m => m.email === cb.dataset.email);
    return { email: member.email, amount_due: member.amount_due };
  });

  if (!totalAmount || !purpose || !selectedDate || !paidBy || selectedMembers.length === 0) {
    document.getElementById('message').textContent = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
    return;
  }

  const creatorEmail = localStorage.getItem('user_email'); // Lấy email từ localStorage

  const formData = new FormData();
  formData.append('total_amount', totalAmount);
  formData.append('purpose', purpose);
  formData.append('date', selectedDate); // Định dạng ngày thành YYYY-MM-DD
  formData.append('paid_by', paidBy);
  formData.append('account_number', accountNumber);
  formData.append('bank_name', bankName);
  formData.append('members', JSON.stringify(selectedMembers));
  formData.append('creator_email', creatorEmail); // Thêm trường creator_email

  try {
    const response = await fetch('https://n8n.thanhhai217.com/webhook/create-bill', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const text = await response.text(); // Lấy phản hồi dưới dạng văn bản
    let result;
    try {
      result = JSON.parse(text); // Thử phân tích JSON
    } catch (e) {
      throw new Error('Phản hồi không phải JSON hợp lệ: ' + text);
    }

    if (result.status === 'success') {
      document.getElementById('message').textContent = 'Hóa đơn đã được tạo thành công!';
    } else {
      document.getElementById('message').textContent = `Lỗi: ${result.message}`;
    }
  } catch (error) {
    console.error('Error submitting bill:', error);
    document.getElementById('message').textContent = 'Lỗi kết nối server hoặc phản hồi không hợp lệ.';
  }
});

// Khởi tạo flatpickr cho trường ngày
flatpickr('#date', {
  dateFormat: 'd/m/Y',
  defaultDate: 'today',
});

// Kiểm tra phiên và tải dữ liệu khi trang được tải
document.addEventListener('DOMContentLoaded', async () => {
  const isSessionValid = await checkSession();
  if (!isSessionValid) return;
  await populateSelectBoxes();
});
