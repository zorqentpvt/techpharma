#!/bin/bash

set -e

echo "🔐 Configuring PostgreSQL authentication for production..."

# Configure pg_hba.conf for production
cat > /var/lib/postgresql/data/pg_hba.conf << EOF
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
host    all             all             172.20.0.0/16           md5

# IPv6 local connections:
host    all             all             ::1/128                 md5

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5

# Production specific: Allow connections from application containers
host    all             all             172.20.0.0/16           md5
EOF

echo "✅ Production authentication configuration completed"
