from app.core.db import supabase
import json

def check_schema(table_name):
    # Try a dummy insert with a likely invalid column to trigger an error message that lists available columns
    test_data = {"__non_existent_column__": 1}
    try:
        res = supabase.table(table_name).insert(test_data).execute()
        print(f"Insert to {table_name} unexpectedly succeeded!")
    except Exception as e:
        # Supabase APIError usually contains message about available columns
        print(f"Error for {table_name}:")
        try:
            # Check the actual error object
            err_data = e.args[0]
            print(json.dumps(err_data, indent=2))
        except:
            print(str(e))

if __name__ == "__main__":
    check_schema("claims")
    check_schema("payouts")
