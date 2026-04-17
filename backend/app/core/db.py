import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from backend root (handles running from different CWDs)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

# Debug logging (safe — only prints first 30 chars of URL, never the key)
logger.info(f"ENV file path: {env_path} (exists: {env_path.exists()})")
logger.info(f"SUPABASE_URL: {url[:30] + '...' if url else 'None'}")
logger.info(f"SUPABASE_KEY: {'***set***' if key else 'None'}")

# Validate
if not url or not key:
    logger.error(
        "Missing Supabase environment variables!\n"
        f"  SUPABASE_URL = {repr(url)}\n"
        f"  SUPABASE_KEY = {repr(key)}\n"
        f"  Looked for .env at: {env_path}\n"
        "  → Please add SUPABASE_URL and SUPABASE_KEY to backend/.env"
    )
    raise ValueError(
        "Missing Supabase environment variables. "
        "Ensure SUPABASE_URL and SUPABASE_KEY are set in backend/.env"
    )

# Initialize Supabase client
from supabase import create_client, Client
supabase: Client = create_client(url, key)
logger.info("Supabase client initialized successfully.")
