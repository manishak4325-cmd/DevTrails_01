from app.core.db import supabase

try:
    supabase.table('claims').insert({'user_id':'a'}).execute()
except Exception as e:
    print("====== DETAILS ======")
    print(getattr(e, 'details', 'no details'))
    print(getattr(e, 'message', str(e)))
