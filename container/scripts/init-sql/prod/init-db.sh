#!/bin/bash

set -e

echo "🚀 Initializing Collex Production Database..."

# Create the postgres user if it doesn't exist and grant permissions
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
            CREATE ROLE postgres WITH LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD '$POSTGRES_PASSWORD';
        END IF;
    END
    \$\$;
    
    -- Grant all privileges on the public schema to the postgres user
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;
    
    -- Grant usage and create privileges on the public schema
    GRANT USAGE, CREATE ON SCHEMA public TO postgres;
    
    -- Make postgres the owner of the public schema
    ALTER SCHEMA public OWNER TO postgres;
    
    -- Grant all privileges on the database to postgres
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO postgres;
EOSQL

# Configure PostgreSQL for production
echo "📝 Configuring PostgreSQL for production..."

# Performance optimizations
cat >> /var/lib/postgresql/data/postgresql.conf << EOF

# Performance Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Connection Settings
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# Logging Settings
log_statement = 'mod'
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Security Settings
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
EOF

# Configure network settings
echo "🌐 Configuring network settings..."
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

echo "✅ Production database initialization completed"
