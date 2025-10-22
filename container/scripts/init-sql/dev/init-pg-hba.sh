#!/bin/bash

set -e

echo "🔐 Configuring PostgreSQL authentication for development..."

# Configure pg_hba.conf for development (more permissive)
cat > /var/lib/postgresql/data/pg_hba.conf << EOF
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
host    all             all             172.21.0.0/16           trust
host    all             all             0.0.0.0/0               trust

# IPv6 local connections:
host    all             all             ::1/128                 trust

# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust

# Development specific: Allow all connections (for ease of development)
host    all             all             172.21.0.0/16           trust
EOF

echo "✅ Development authentication configuration completed"
