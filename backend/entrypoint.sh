#!/bin/bash
set -e

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Create default admin user
echo "Creating default admin user..."
python create_admin.py

# Start the application
echo "Starting application..."
exec "$@"
