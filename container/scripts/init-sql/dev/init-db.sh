#!/bin/bash

set -e

echo "🚀 Initializing Collex Development Database..."

# Create the postgres user if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
            CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD '$POSTGRES_PASSWORD';
        END IF;
    END
    \$\$;
EOSQL

# Configure PostgreSQL for development
echo "📝 Configuring PostgreSQL for development..."

# Development-friendly settings
cat >> /var/lib/postgresql/data/postgresql.conf << EOF

# Development Settings
shared_buffers = 128MB
effective_cache_size = 512MB
maintenance_work_mem = 32MB
checkpoint_completion_target = 0.9
wal_buffers = 8MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Connection Settings
max_connections = 50

# Logging Settings (More verbose for development)
log_statement = 'all'
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 50MB
log_min_duration_statement = 0
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Development specific
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
EOF

# Configure network settings
echo "🌐 Configuring network settings..."
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

echo "✅ Development database initialization completed"
