#!/bin/bash
set -e

# Configure pg_hba.conf for proper authentication
cat >> /var/lib/postgresql/data/pg_hba.conf << 'EOF'

# Custom configuration for user_onboarding application
# In scripts/init.sql/dev/init-pg-hba.sh, add:
host    all             all             0.0.0.0/0               md5
EOF

echo "✅ pg_hba.conf configuration completed"