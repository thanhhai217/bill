// Tính phần trăm đã thanh toán của bill
function calculateProgress(participants) {
    const total = participants.reduce((sum, p) => sum + p.amount_due, 0);
    const paid = participants.filter(p => p.is_paid).reduce((sum, p) => sum + p.amount_due, 0);
    return Math.round((paid / total) * 100);
}

// Kiểm tra bill đã hoàn thành chưa
function isBillFullyPaid(participants) {
    return participants.every(p => p.is_paid);
}

// Format tiền tệ (VND)
function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + ' ₫';
}
