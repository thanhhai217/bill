let membersWithAmount = [];

// Helper function to parse formatted number
function parseFormattedNumber(value) {
  return parseInt(value.toString().replace(/\D/g, '')) || 0;
}

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
  } catch (error) {
    console.error('Session check error:', error);
    alert('Lỗi kết nối server. Vui lòng đăng nhập lại.');
    window.location.href = '/index.html';
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
    
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Fetch members error:', error);
    document.getElementById('message').textContent = 'Không thể lấy danh sách người dùng. Vui lòng thử lại.';
    return [];
  }
}

// Cập nhật số tiền chia cho từng thành viên
function updateAmounts(totalAmount) {
  // Parse formatted amount to number
  totalAmount = parseFormattedNumber(totalAmount);
  
  // Get all checked members
  const checkedMembers = Array.from(document.querySelectorAll('#members-list input[type="checkbox"]:checked'));
  
  // Calculate amount per person (floor to ensure no overcharge)
  const perPerson = checkedMembers.length > 0 ? Math.floor(totalAmount / checkedMembers.length) : 0;
  
  // Update UI and data for each member
  membersWithAmount.forEach(member => {
    const checkbox = document.querySelector(`input[data-email="${member.email}"]`);
    const amountSpan = document.querySelector(`span[data-amount="${member.email}"]`);
    
    if (checkbox && amountSpan) {
      if (checkbox.checked) {
        member.amount_due = perPerson;
        amountSpan.textContent = `${perPerson.toLocaleString('vi-VN')}đ`;
      } else {
        member.amount_due = 0;
        amountSpan.textContent = '0đ';
      }
    }
  });

  document.getElementById('selected-count').textContent = checkedMembers.length;
}

// Hàm chung để hiển thị/ẩn modal
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList[show ? 'remove' : 'add']('hidden');
  }
}

// Hàm chung để lấy danh sách thành viên đã chọn
function getSelectedMembers() {
  return Array.from(document.querySelectorAll('#members-list input[type="checkbox"]:checked')).map(cb => {
    const member = membersWithAmount.find(m => m.email === cb.dataset.email);
    return { email: member.email, amount_due: member.amount_due };
  });
}

// Tải danh sách thành viên và hiển thị trong modal
async function populateSelectBoxes() {
  const members = await fetchMembers();
  if (!members.length) return;

  const paidBySelect = document.getElementById('paid-by');
  members.forEach(m => {
    if ([...paidBySelect.options].some(option => option.value === m.email)) return;
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
      updateAmounts(document.getElementById('total-amount').value);
    });
  });

  setupModalEvents();

  // Thiết lập sự kiện cho các nút chọn/bỏ chọn tất cả
  document.getElementById('select-all').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#members-list input[type="checkbox"]').forEach(cb => cb.checked = true);
    updateAmounts(document.getElementById('total-amount').value);
  });

  document.getElementById('unselect-all').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('#members-list input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateAmounts(document.getElementById('total-amount').value);
  });

  // Thiết lập sự kiện cho input số tiền
  document.getElementById('total-amount').addEventListener('input', function(e) {
    // Format số tiền
    let value = this.value.replace(/\D/g, '');
    if (value) {
      this.value = parseInt(value).toLocaleString('vi-VN');
    }
    // Cập nhật số tiền chia
    updateAmounts(this.value);
  });
}

// Xử lý sự kiện cho các nút trong modal
function setupModalEvents() {
  const dropdownButton = document.getElementById('split-bill-dropdown');
  const saveMembersButton = document.getElementById('save-members');

  if (dropdownButton && saveMembersButton) {
    dropdownButton.addEventListener('click', () => {
      toggleModal('members-modal', true);
    });

    saveMembersButton.addEventListener('click', () => {
      const selectedMembers = getSelectedMembers();
      const totalMembers = document.querySelectorAll('#members-list input[type="checkbox"]').length;

      if (selectedMembers.length === 0) {
        document.getElementById('message').textContent = 'Vui lòng chọn ít nhất một thành viên để chia bill.';
        return;
      }

      dropdownButton.textContent = selectedMembers.length === totalMembers 
        ? 'Chia đều cho tất cả' 
        : `Chia cho ${selectedMembers.length} người`;

      toggleModal('members-modal', false);
    });
  }
}

// Xử lý sự kiện submit form
async function handleSubmitBill(event) {
  const submitButton = document.getElementById('submit-bill');
  submitButton.disabled = true;
  submitButton.textContent = 'Đang xử lý...';

  try {
    // Validate input
    const totalAmount = document.getElementById('total-amount').value;
    const purpose = document.getElementById('purpose').value;
    const selectedDate = flatpickr.formatDate(flatpickr.parseDate(document.getElementById('date').value, 'd/m/Y'), 'Y-m-d');
    const paidBy = document.getElementById('paid-by').value;
    const accountNumber = document.getElementById('bank-account').value.trim();
    const bankName = document.getElementById('bank-name').value.trim();
    const selectedMembers = getSelectedMembers();

    const missingFields = [];
    if (!totalAmount) missingFields.push('số tiền');
    if (!purpose) missingFields.push('loại ghi chú');
    if (!selectedDate) missingFields.push('thời gian');
    if (!paidBy) missingFields.push('người trả');
    if (selectedMembers.length === 0) missingFields.push('người tham gia');

    if (missingFields.length > 0) {
      document.getElementById('message').textContent = `Vui lòng điền: ${missingFields.join(', ')}`;
      return;
    }

    const formData = new FormData();
    formData.append('total_amount', parseFormattedNumber(totalAmount));
    formData.append('purpose', purpose);
    formData.append('date', selectedDate);
    formData.append('paid_by', paidBy);
    formData.append('account_number', accountNumber);
    formData.append('bank_name', bankName);
    formData.append('members', JSON.stringify(selectedMembers));
    formData.append('creator_email', localStorage.getItem('user_email'));

    const response = await fetch('https://n8n.thanhhai217.com/webhook/create-bill', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = JSON.parse(await response.text());

    if (result.status === 'success') {
      document.getElementById('message').textContent = 'Hóa đơn đã được tạo thành công!';
      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 1500);
    } else {
      document.getElementById('message').textContent = `Lỗi: ${result.message}`;
    }
  } catch (error) {
    console.error('Error submitting bill:', error);
    document.getElementById('message').textContent = 'Lỗi kết nối server hoặc phản hồi không hợp lệ.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Thêm chi tiêu';
  }
}

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', async () => {
  const isSessionValid = await checkSession();
  if (!isSessionValid) return;

  flatpickr('#date', {
    dateFormat: 'd/m/Y',
    defaultDate: 'today',
    maxDate: 'today'
  });

  const creatorEmail = localStorage.getItem('user_email');
  const paidBySelect = document.getElementById('paid-by');
  
  if (creatorEmail && paidBySelect) {
    const defaultOption = document.createElement('option');
    defaultOption.value = creatorEmail;
    defaultOption.textContent = creatorEmail.split('@')[0];
    defaultOption.selected = true;
    paidBySelect.appendChild(defaultOption);
  }

  await populateSelectBoxes();
  document.getElementById('submit-bill').addEventListener('click', handleSubmitBill);
});