from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List
import psycopg2
from database import get_connection

app = FastAPI()

# Định nghĩa Schema cho dữ liệu đầu vào
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

# API tạo bill
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
