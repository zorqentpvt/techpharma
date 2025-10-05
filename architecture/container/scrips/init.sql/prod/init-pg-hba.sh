#!/bin/bash
set -e

# Configure pg_hba.conf for proper authentication
cat >> /var/lib/postgresql/data/pg_hba.conf << 'EOF'

# Custom configuration for user_onboarding application
host    all             all             172.20.0.0/16           md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
local   all             all                                     md5
EOF

echo "✅ pg_hba.conf configuration completed"