from app.services.ai_engine import ai_engine
from datetime import datetime

class ClaimEngine:
    def process_auto_claim(self, user_id: str, disruption_event: dict, base_income: float, disruption_hours: float, time_of_day: float = 12) -> dict:
        """
        Takes a disruption event, predicts income loss, and generates an auto-claim payload.
        """
        # Calculate expected loss via AI engine regression
        expected_loss = ai_engine.predict_income_loss(base_income, disruption_hours, time_of_day)
        
        # Calculate a dynamic claim payout based on expected loss and the trigger
        base_payout = 500.0  # Base payout amount per disruption
        total_claim_value = base_payout + expected_loss
        
        claim_record = {
            "user_id": user_id,
            "trigger": disruption_event.get("type", "unknown"),
            "reason": disruption_event.get("reason", "Disruption occurred"),
            "disruption_hours": disruption_hours,
            "expected_loss": expected_loss,
            "total_claim_value": total_claim_value,
            "status": "generated", # Will be updated after fraud check
            "created_at": datetime.utcnow().isoformat()
        }
        
        return claim_record

claim_engine = ClaimEngine()
