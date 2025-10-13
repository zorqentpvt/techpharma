#!/bin/bash

set -e

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

# Configure PostgreSQL to listen on all addresses
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

# Log configuration
echo "log_statement = 'all'" >> /var/lib/postgresql/data/postgresql.conf
echo "log_destination = 'stderr'" >> /var/lib/postgresql/data/postgresql.conf
echo "logging_collector = on" >> /var/lib/postgresql/data/postgresql.conf

echo "✅ Database initialization completed"