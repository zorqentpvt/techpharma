#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$PROJECT_ROOT/client/src/types/generated"

echo -e "${BLUE}🧪 Type Generation Testing${NC}"
echo "=========================="

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

# Test 1: Check if generated directory exists
echo "Test 1: Generated directory exists"
if [ -d "$GENERATED_DIR" ]; then
    print_status "Generated directory exists"
else
    print_error "Generated directory not found: $GENERATED_DIR"
    exit 1
fi

# Test 2: Check expected files exist
echo ""
echo "Test 2: Expected files exist"
EXPECTED_FILES=("shared.ts" "entities.ts" "api.ts" "responses.ts" "services.ts" "index.ts")
MISSING_FILES=()

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$GENERATED_DIR/$file" ]; then
        print_status "$file exists"
    else
        MISSING_FILES+=("$file")
        print_error "$file missing"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_error "Missing files: ${MISSING_FILES[*]}"
    exit 1
fi

# Test 3: Check for expected types
echo ""
echo "Test 3: Expected types exist"
EXPECTED_TYPES=(
    "User" "Role" "Permission" "BaseModel" "UserRole" "RolePermission"
    "Response" "ErrorInfo" "MetaInfo"
    "LoginRequest" "LoginResponse" "RegisterRequest" "UpdateUserRequest"
    "Claims"
    "UserRole" "PermissionAction" "PermissionResource" "ResponseStatus" "ErrorCode"
)

ALL_CONTENT=""
for file in "$GENERATED_DIR"/*.ts; do
    if [ -f "$file" ]; then
        ALL_CONTENT="$ALL_CONTENT$(cat "$file")"$'\n'
    fi
done

MISSING_TYPES=()
for type in "${EXPECTED_TYPES[@]}"; do
    if echo "$ALL_CONTENT" | grep -q "export \(interface\|type\) $type"; then
        print_status "Type $type found"
    else
        MISSING_TYPES+=("$type")
        print_error "Type $type missing"
    fi
done

if [ ${#MISSING_TYPES[@]} -gt 0 ]; then
    print_error "Missing types: ${MISSING_TYPES[*]}"
    exit 1
fi

# Test 4: Check for proper imports
echo ""
echo "Test 4: Import structure validation"

# Check if index.ts re-exports everything
if [ -f "$GENERATED_DIR/index.ts" ]; then
    index_exports=$(grep -c "export \* from" "$GENERATED_DIR/index.ts" 2>/dev/null || echo "0")
    if [ "$index_exports" -gt 0 ]; then
        print_status "Index file has $index_exports re-exports"
    else
        print_warning "Index file has no re-exports"
    fi
else
    print_error "Index file missing"
fi

# Test 5: Check for TypeScript syntax errors
echo ""
echo "Test 5: TypeScript syntax validation"

if command -v tsc &> /dev/null; then
    cd "$PROJECT_ROOT/client"
    
    # Create a temporary test file to import all generated types
    TEST_FILE="$GENERATED_DIR/test-imports.ts"
    cat > "$TEST_FILE" << EOF
// Temporary test file for import validation
import * as GeneratedTypes from './index';

// Test that we can access some key types
const testUser: GeneratedTypes.User = {} as any;
const testResponse: GeneratedTypes.Response = {} as any;
const testLoginRequest: GeneratedTypes.LoginRequest = {} as any;

// Export to avoid unused variable warnings
export { testUser, testResponse, testLoginRequest };
EOF

    if tsc --noEmit --skipLibCheck "$TEST_FILE"; then
        print_status "TypeScript syntax validation passed"
    else
        print_error "TypeScript syntax validation failed"
        rm -f "$TEST_FILE"
        exit 1
    fi
    
    # Clean up test file
    rm -f "$TEST_FILE"
else
    print_warning "TypeScript compiler not found, skipping syntax validation"
fi

# Test 6: Check file sizes (detect empty files)
echo ""
echo "Test 6: File size validation"

for file in "$GENERATED_DIR"/*.ts; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        filename=$(basename "$file")
        
        if [ "$size" -lt 50 ]; then
            print_error "$filename is too small ($size bytes) - likely empty or malformed"
            exit 1
        elif [ "$size" -lt 200 ]; then
            print_warning "$filename is small ($size bytes) - might have limited content"
        else
            print_status "$filename has good size ($size bytes)"
        fi
    fi
done

# Test 7: Check for common issues
echo ""
echo "Test 7: Common issues check"

ISSUES_FOUND=0

# Check for 'any' types (should be replaced with 'unknown')
if grep -r ": any" "$GENERATED_DIR" >/dev/null 2>&1; then
    print_warning "Found 'any' types - should be 'unknown'"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for interface{} (should be 'unknown')
if grep -r "interface{}" "$GENERATED_DIR" >/dev/null 2>&1; then
    print_warning "Found 'interface{}' - should be 'unknown'"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for proper null handling
if ! grep -r "string | null" "$GENERATED_DIR" >/dev/null 2>&1; then
    print_warning "No nullable string types found - might indicate pointer type mapping issues"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    print_status "No common issues found"
else
    print_warning "Found $ISSUES_FOUND potential issues"
fi

# Test 8: Generate usage examples
echo ""
echo "Test 8: Generate usage examples"

EXAMPLES_FILE="$GENERATED_DIR/usage-examples.ts"
cat > "$EXAMPLES_FILE" << 'EOF'
/* eslint-disable */
// This file contains usage examples for generated types
// It's auto-generated for documentation purposes

import type {
  User,
  LoginRequest,
  LoginResponse,
  Response,
  ErrorInfo,
  UserRole,
  Permission,
  Claims
} from './index';

// Example: API call with generated types
export const loginUser = async (
  credentials: LoginRequest
): Promise<Response> => {
  // Implementation would go here
  return {} as Response;
};

// Example: Component props with generated types
export interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
  currentUserRole: UserRole;
}

// Example: Type guards
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'firstName' in obj &&
    'lastName' in obj
  );
}

// Example: Error handling
export function handleApiError(error: ErrorInfo): string {
  return `${error.code}: ${error.message}`;
}

// Example: JWT token handling
export function isTokenExpired(claims: Claims): boolean {
  return Date.now() / 1000 > claims.exp;
}
EOF

print_status "Generated usage examples at: $(basename "$EXAMPLES_FILE")"

# Final summary
echo ""
echo "🎉 Type Generation Test Summary"
echo "=============================="
print_status "All tests passed successfully!"
echo ""
echo "Generated files:"
for file in "$GENERATED_DIR"/*.ts; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        size=$(wc -c < "$file")
        types_count=$(grep -c "^export \(interface\|type\)" "$file" 2>/dev/null || echo "0")
        echo "  📄 $filename ($size bytes, $types_count types)"
    fi
done

echo ""
echo "✨ Type generation is working correctly!"
echo "You can now use these types in your frontend application."
