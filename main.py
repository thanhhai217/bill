from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
import psycopg2
from database import get_connection

app = FastAPI()

# -------------------------
# 🔹 Định nghĩa Schema
# -------------------------

class Participant(BaseModel):
    email: EmailStr
    amount_due: float

class CreateBillRequest(BaseModel):
    purpose: str
    date: str
    total_amount: float
    creator_email: EmailStr
    participants: List[Participant]
    qr_url: str = None
    account_number: str = None
    bank_name: str = None

class UpdatePaymentRequest(BaseModel):
    bill_id: int
    email: EmailStr

# -------------------------
# 🔹 API Tạo Bill
# -------------------------
@app.post("/create-bill")
def create_bill(bill: CreateBillRequest):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Kiểm tra creator_email có tồn tại không
        cursor.execute("SELECT email FROM users WHERE email = %s", (bill.creator_email,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=400, detail="Người tạo bill không tồn tại")

        # Chèn hóa đơn vào bảng bills
        cursor.execute(
            """INSERT INTO bills (purpose, date, total_amount, creator_email, status, qr_url, account_number, bank_name)
               VALUES (%s, %s, %s, %s, 'Chưa thanh toán', %s, %s, %s) RETURNING id""",
            (bill.purpose, bill.date, bill.total_amount, bill.creator_email, bill.qr_url, bill.account_number, bill.bank_name)
        )
        bill_id = cursor.fetchone()[0]  # Lấy ID của bill vừa tạo

        # Thêm danh sách người tham gia vào bảng bill_participants
        for participant in bill.participants:
            cursor.execute(
                "INSERT INTO bill_participants (bill_id, email, amount_due, is_paid) VALUES (%s, %s, %s, FALSE)",
                (bill_id, participant.email, participant.amount_due)
            )

        conn.commit()  # Lưu thay đổi vào database

        return {"message": "Tạo bill thành công", "bill_id": bill_id}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()

# -------------------------
# 🔹 API Lấy danh sách Bill
# -------------------------
@app.get("/get-bills/{user_email}")
def get_bills(user_email: str):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT b.id, b.purpose, b.date, b.total_amount, b.creator_email, b.status, b.qr_url, 
                   b.account_number, b.bank_name, bp.amount_due, bp.is_paid
            FROM bills b
            LEFT JOIN bill_participants bp ON b.id = bp.bill_id
            WHERE b.creator_email = %s OR bp.email = %s
            ORDER BY b.status, b.date DESC
        """, (user_email, user_email))

        bills = []
        for row in cursor.fetchall():
            bills.append({
                "bill_id": row[0],
                "purpose": row[1],
                "date": row[2],
                "total_amount": row[3],
                "creator_email": row[4],
                "status": row[5],
                "qr_url": row[6],
                "account_number": row[7],
                "bank_name": row[8],
                "amount_due": row[9],
                "is_paid": row[10]
            })

        return {"bills": bills}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()

# -------------------------
# 🔹 API Cập nhật trạng thái thanh toán
# -------------------------
@app.post("/update-payment")
def update_payment(payment: UpdatePaymentRequest):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Kiểm tra user có trong danh sách bill không
        cursor.execute(
            "SELECT * FROM bill_participants WHERE bill_id = %s AND email = %s",
            (payment.bill_id, payment.email)
        )
        participant = cursor.fetchone()

        if not participant:
            raise HTTPException(status_code=400, detail="Bạn không phải là người tham gia bill này.")

        # Cập nhật trạng thái thanh toán
        cursor.execute(
            "UPDATE bill_participants SET is_paid = TRUE WHERE bill_id = %s AND email = %s",
            (payment.bill_id, payment.email)
        )

        # Kiểm tra xem tất cả đã thanh toán chưa
        cursor.execute(
            "SELECT COUNT(*) FROM bill_participants WHERE bill_id = %s AND is_paid = FALSE",
            (payment.bill_id,)
        )
        unpaid_count = cursor.fetchone()[0]

        if unpaid_count == 0:
            # Nếu tất cả đã thanh toán, cập nhật bill thành "Đã thanh toán"
            cursor.execute(
                "UPDATE bills SET status = 'Đã thanh toán' WHERE id = %s",
                (payment.bill_id,)
            )

        conn.commit()
        return {"message": "Cập nhật thanh toán thành công"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()
