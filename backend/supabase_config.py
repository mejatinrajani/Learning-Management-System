"""
Supabase Configuration for LMS Portal
This file contains all Supabase-related configurations
"""

import os
from decouple import config

# Supabase Project Details
SUPABASE_URL = config('SUPABASE_URL', default='https://ciuwntaiuihptsrnjdnn.supabase.co')
SUPABASE_PUBLISHABLE_KEY = config('SUPABASE_PUBLISHABLE_KEY', default='')
SUPABASE_SERVICE_ROLE_KEY = config('SUPABASE_SERVICE_ROLE_KEY', default='')

# Database Configuration
DB_HOST = config('DB_HOST', default='ciuwntaiuihptsrnjdnn.supabase.co')
DB_PORT = config('DB_PORT', default=5432, cast=int)
DB_NAME = config('DB_NAME', default='postgres')
DB_USER = config('DB_USER', default='postgres')
DB_PASSWORD = config('DB_PASSWORD', default='')

# Project ID (extracted from host)
PROJECT_ID = 'ciuwntaiuihptsrnjdnn'

# Connection String
DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

# Supabase Service Configuration
SUPABASE_CONFIG = {
    'url': SUPABASE_URL,
    'key': SUPABASE_PUBLISHABLE_KEY,
    'service_role_key': SUPABASE_SERVICE_ROLE_KEY,
    'db_url': DATABASE_URL,
    'db_host': DB_HOST,
    'db_port': DB_PORT,
    'db_name': DB_NAME,
    'db_user': DB_USER,
    'project_id': PROJECT_ID,
}

# Supabase API Endpoints
SUPABASE_API_ENDPOINTS = {
    'auth': f'{SUPABASE_URL}/auth/v1',
    'rest': f'{SUPABASE_URL}/rest/v1',
    'realtime': f'{SUPABASE_URL}/realtime/v1',
    'storage': f'{SUPABASE_URL}/storage/v1',
    'functions': f'{SUPABASE_URL}/functions/v1',
}

# JWT Configuration
JWT_CONFIG = {
    'algorithm': 'HS256',
    'service_role_key': SUPABASE_SERVICE_ROLE_KEY,
    'anon_key': SUPABASE_PUBLISHABLE_KEY,
}
