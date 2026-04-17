def calculate_rollback_protection(expected_income: float, actual_income: float) -> float:
    """
    Rollback protection calculates compensation if a user stops mid-shift due to disruption.
    Expected vs Actual hourly income gap.
    """
    diff = expected_income - actual_income
    return max(0.0, float(diff))

def process_payout(user_email: str, base_amount: float, disruption_hours: int, actual_income: float = 0) -> dict:
    """
    Simulates sending money via UPI/Razorpay.
    """
    # Calculate Rollback if disruption_hours > 0
    expected_income = disruption_hours * 150 # Assume 150/hr average income
    rollback_compensation = calculate_rollback_protection(expected_income, actual_income)
    
    total_payout = base_amount + rollback_compensation
    
    transaction_id = f"txn_api_{hash(user_email + str(total_payout))}"[:15]
    
    return {
        "status": "success",
        "amount_credited": total_payout,
        "base_amount": base_amount,
        "rollback_compensation": rollback_compensation,
        "transaction_id": transaction_id,
        "message": f"₹{total_payout:.2f} credited instantly via UPI"
    }
