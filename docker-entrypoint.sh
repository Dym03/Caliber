#!/bin/sh
set -e

echo "==> Starting Caliber container..."

# Check if PostgreSQL is being used and wait for it to be ready
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -Eq "postgres|psql"; then
    echo "==> Checking database connection..."
    python << 'EOF'
import sys
import time
import environ

env = environ.Env()
db_config = env.db_url("DATABASE_URL")

host = db_config.get("HOST", "localhost")
port = int(db_config.get("PORT") or 5432)
user = db_config.get("USER", "")
password = db_config.get("PASSWORD", "")
dbname = db_config.get("NAME", "")

max_retries = 30
for attempt in range(1, max_retries + 1):
    try:
        import psycopg
        conn = psycopg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname,
            connect_timeout=3,
        )
        conn.close()
        print(f"==> Database ready after {attempt} attempt(s).")
        sys.exit(0)
    except Exception as e:
        print(f"==> Waiting for database (attempt {attempt}/{max_retries}): {e}")
        time.sleep(2)

print("==> ERROR: Could not connect to PostgreSQL within the timeout period.", file=sys.stderr)
sys.exit(1)
EOF
fi

# Run database migrations
echo "==> Running database migrations..."
python manage.py migrate --no-input

echo "==> Startup preparation complete. Executing command..."
exec "$@"

