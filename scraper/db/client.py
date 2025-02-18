from supabase import create_client, Client
import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

def get_supabase_client(env: Optional[str] = None) -> Client:
    """
    Get a Supabase client based on the environment.
    
    Args:
        env: Optional environment override ('local' or 'production'). 
             If not provided, uses SUPABASE_ENV from environment variables.
    
    Returns:
        A configured Supabase client
    
    Raises:
        ValueError: If the environment variables are not set or invalid environment specified
    """
    # Get environment - default to what's in env file, but allow override
    supabase_env = env or os.getenv('SUPABASE_ENV', 'local')
    
    if supabase_env not in ['local', 'production']:
        raise ValueError(f"Invalid environment: {supabase_env}. Must be 'local' or 'production'")
    
    # Get the appropriate URL and key based on environment
    url_key = f"SUPABASE_{supabase_env.upper()}_URL"
    api_key = f"SUPABASE_{supabase_env.upper()}_KEY"
    
    url = os.getenv(url_key)
    key = os.getenv(api_key)
    
    if not url or not key:
        raise ValueError(f"Missing required environment variables: {url_key} and/or {api_key}")
    
    return create_client(url, key) 