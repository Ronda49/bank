from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import json
import os

app = FastAPI(title="Sudharshan Bank ATM API")


# -----------------------------
# Data Models
# -----------------------------
class RegisterRequest(BaseModel):
    account_number: int
    name: str
    pin: int
    gender: str
    age: int


class LoginRequest(BaseModel):
    account_number: int
    pin: int


class TransactionRequest(BaseModel):
    account_number: int
    amount: float


# -----------------------------
# Utility Functions
# -----------------------------
DB_FILE = "fake_db.json"


def load_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump({}, f)
    with open(DB_FILE, "r") as f:
        return json.load(f)


def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)


# -----------------------------
# API Endpoints
# -----------------------------
@app.post("/register")
def register(req: RegisterRequest):
    data = load_db()
    acct_str = str(req.account_number)

    if acct_str in data:
        raise HTTPException(status_code=400, detail="Account number already exists.")

    data[acct_str] = {
        "name": req.name,
        "pin": req.pin,
        "gender": req.gender,
        "age": req.age,
        "balance": 0,
        "transactions": []
    }

    save_db(data)
    return {"message": f"Account created successfully for {req.name}."}


@app.post("/login")
def login(req: LoginRequest):
    data = load_db()
    acct_str = str(req.account_number)

    if acct_str not in data:
        raise HTTPException(status_code=404, detail="Account not found.")

    if data[acct_str]["pin"] != req.pin:
        raise HTTPException(status_code=401, detail="Invalid PIN.")

    return {
        "message": "Login successful.",
        "name": data[acct_str]["name"],
        "balance": data[acct_str]["balance"]
    }


@app.post("/deposit")
def deposit(req: TransactionRequest):
    data = load_db()
    acct_str = str(req.account_number)

    if acct_str not in data:
        raise HTTPException(status_code=404, detail="Account not found.")

    data[acct_str]["balance"] += req.amount
    data[acct_str]["transactions"].append(
        {"type": "deposit", "amount": req.amount}
    )

    save_db(data)
    return {
        "message": f"₹{req.amount} deposited successfully.",
        "balance": data[acct_str]["balance"]
    }


@app.post("/withdraw")
def withdraw(req: TransactionRequest):
    data = load_db()
    acct_str = str(req.account_number)

    if acct_str not in data:
        raise HTTPException(status_code=404, detail="Account not found.")

    if data[acct_str]["balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance.")

    data[acct_str]["balance"] -= req.amount
    data[acct_str]["transactions"].append(
        {"type": "withdraw", "amount": req.amount}
    )

    save_db(data)
    return {
        "message": f"₹{req.amount} withdrawn successfully.",
        "balance": data[acct_str]["balance"]
    }


@app.get("/balance/{acct_num}")
def get_balance(acct_num: int):
    data = load_db()
    acct_str = str(acct_num)

    if acct_str not in data:
        raise HTTPException(status_code=404, detail="Account not found.")

    return {"balance": data[acct_str]["balance"]}


@app.get("/transactions/{acct_num}")
def get_transactions(acct_num: int):
    data = load_db()
    acct_str = str(acct_num)

    if acct_str not in data:
        raise HTTPException(status_code=404, detail="Account not found.")

    return {"transactions": data[acct_str]["transactions"]}
