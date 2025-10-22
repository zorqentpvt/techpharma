#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$PROJECT_ROOT/client/src/types/generated"
BACKUP_DIR="$PROJECT_ROOT/client/src/types/backup/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}🚀 Enhanced TypeScript Type Generation${NC}"
echo "================================================"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if tygo is installed
if ! command -v tygo &> /dev/null; then
    print_error "tygo is not installed. Installing..."
    go install github.com/gzuidhof/tygo@latest
    if [ $? -eq 0 ]; then
        print_status "tygo installed successfully"
    else
        print_error "Failed to install tygo"
        exit 1
    fi
fi

# Check if tygo.yaml exists
if [ ! -f "$PROJECT_ROOT/tygo.yaml" ]; then
    print_error "tygo.yaml configuration file not found"
    exit 1
fi

# Create backup of existing types
if [ -d "$GENERATED_DIR" ]; then
    print_status "Creating backup of existing types..."
    mkdir -p "$BACKUP_DIR"
    cp -r "$GENERATED_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    print_status "Backup created at: $BACKUP_DIR"
fi

# Ensure generated directory exists
mkdir -p "$GENERATED_DIR"

# Change to project root for tygo
cd "$PROJECT_ROOT"

print_status "Generating TypeScript types from Go..."

# Run tygo with error handling
if tygo generate; then
    print_status "Type generation completed successfully"
else
    print_error "Type generation failed"
    
    # Restore backup if generation failed
    if [ -d "$BACKUP_DIR" ]; then
        print_warning "Restoring backup..."
        rm -rf "$GENERATED_DIR"
        mkdir -p "$GENERATED_DIR"
        cp -r "$BACKUP_DIR"/* "$GENERATED_DIR/" 2>/dev/null || true
        print_status "Backup restored"
    fi
    
    exit 1
fi

# Run post-processing script
if [ -f "$SCRIPT_DIR/fix-generated-types.js" ]; then
    print_status "Running post-processing..."
    if node "$SCRIPT_DIR/fix-generated-types.js"; then
        print_status "Post-processing completed"
    else
        print_warning "Post-processing had issues, but continuing..."
    fi
else
    print_warning "Post-processing script not found, skipping..."
fi

# Validate generated files
print_status "Validating generated files..."

EXPECTED_FILES=("shared.ts" "entities.ts" "api.ts" "responses.ts" "services.ts")
MISSING_FILES=()

for file in "${EXPECTED_FILES[@]}"; do
    if [ ! -f "$GENERATED_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_warning "Some expected files were not generated: ${MISSING_FILES[*]}"
else
    print_status "All expected files generated successfully"
fi

# Check file sizes (empty files might indicate issues)
for file in "$GENERATED_DIR"/*.ts; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        filename=$(basename "$file")
        if [ "$size" -lt 50 ]; then
            print_warning "$filename is very small ($size bytes) - might be empty or have issues"
        else
            print_status "$filename generated successfully ($size bytes)"
        fi
    fi
done

# Run TypeScript compilation check if tsc is available
if command -v tsc &> /dev/null && [ -f "$PROJECT_ROOT/client/tsconfig.json" ]; then
    print_status "Running TypeScript compilation check..."
    cd "$PROJECT_ROOT/client"
    
    if tsc --noEmit --skipLibCheck; then
        print_status "TypeScript compilation check passed"
    else
        print_warning "TypeScript compilation check failed - there might be type issues"
    fi
fi

# Generate type summary
print_status "Generating type summary..."
echo ""
echo "📊 Generated Types Summary:"
echo "=========================="

for file in "$GENERATED_DIR"/*.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        types_count=$(grep -c "^export \(interface\|type\)" "$file" 2>/dev/null || echo "0")
        echo "  $filename: $types_count types"
    fi
done

echo ""
print_status "Type generation completed successfully! 🎉"
echo ""
echo "📁 Generated files location: $GENERATED_DIR"
echo "💾 Backup location: $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "  1. Import types in your frontend: import { User, LoginRequest } from '@/types/generated'"
echo "  2. Use the types in your API calls and components"
echo "  3. Run 'make test-types' to validate the integration"
