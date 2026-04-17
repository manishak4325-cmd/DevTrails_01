from app.core.db import supabase
from datetime import datetime
import json

try:
    claim_payload = {
        "user_id": "test_auto_user_1",
        "trigger": "aqi",
        "disruption_hours": 3.0,
        "expected_loss": 500.0,
        "total_claim_value": 1000.0,
        "status": "Rejected",
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Try inserting this
    res = supabase.table("claims").insert(claim_payload).execute()
    print("Success:", res)
except Exception as e:
    print("Exact error dictionary:")
    print(json.dumps(e.args[0], indent=2))
