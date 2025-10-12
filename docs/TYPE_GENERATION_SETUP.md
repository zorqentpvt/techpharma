# Type Generation System Setup

## Overview

This document describes the implemented type generation system that automatically converts Go structs to TypeScript types, ensuring type safety between the backend and frontend.

## System Components

### 1. Configuration Files

- **`tygo.yaml`**: Main configuration for type generation
- **`shared/types.go`**: Shared constants and enums
- **Go structs with `// tygo:emit`**: Marked for type generation

### 2. Scripts

- **`scripts/generate-types-enhanced.sh`**: Main type generation script
- **`scripts/fix-generated-types.js`**: Post-processing for type cleanup
- **`scripts/test-type-generation.sh`**: Validation and testing

### 3. Generated Output

```
client/src/types/generated/
├── shared.ts      # Constants and enums
├── entities.ts    # Database models
├── api.ts         # API request/response types
├── responses.ts   # HTTP response types
├── services.ts    # Service types (Claims, etc.)
└── index.ts       # Consolidated exports
```

## Quick Start

### 1. Setup Environment

```bash
make types-setup
```

This will:

- Install tygo
- Create necessary directories
- Set script permissions

### 2. Generate Types

```bash
# Basic generation
make generate-types

# Enhanced generation with validation
make generate-types-enhanced

# Test the generation
make test-types
```

### 3. Use Generated Types

```typescript
// Import specific types
import { User, LoginRequest, Response } from "@/types/generated";

// Use in API calls
const loginUser = async (credentials: LoginRequest): Promise<Response> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

// Use in components
interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
}
```

## Available Make Commands

| Command                        | Description                               |
| ------------------------------ | ----------------------------------------- |
| `make types-setup`             | Setup type generation environment         |
| `make generate-types`          | Basic type generation                     |
| `make generate-types-enhanced` | Enhanced generation with validation       |
| `make test-types`              | Test generated types                      |
| `make watch-types`             | Watch for changes and auto-regenerate     |
| `make dev-with-types`          | Development workflow with type generation |

## Generated Types

### Shared Types (`shared.ts`)

- `UserRole`: User role constants
- `PermissionAction`: Permission actions (create, read, update, delete)
- `PermissionResource`: Resources that can be accessed
- `ErrorCode`: Standardized error codes

### Entity Types (`entities.ts`)

- `BaseModel`: Base model with ID, timestamps
- `User`: User entity
- `Role`: Role entity
- `Permission`: Permission entity
- `UserRole`: User-role relationship
- `RolePermission`: Role-permission relationship

### API Types (`api.ts`)

- `LoginRequest/LoginResponse`: Authentication
- `RegisterRequest`: User registration
- `UpdateUserRequest`: User updates
- `CreateRoleRequest/UpdateRoleRequest`: Role management
- `CreatePermissionRequest/UpdatePermissionRequest`: Permission management

### Response Types (`responses.ts`)

- `Response`: Standardized API response
- `ErrorInfo`: Error information structure
- `MetaInfo`: Pagination metadata

### Service Types (`services.ts`)

- `Claims`: JWT token claims

## Development Workflow

### 1. Adding New Types

1. Create or update Go struct with `// tygo:emit` comment:

```go
// tygo:emit
type NewEntity struct {
    BaseModel
    Name        string `json:"name"`
    Description string `json:"description"`
}
```

2. Regenerate types:

```bash
make generate-types-enhanced
```

3. Use in frontend:

```typescript
import { NewEntity } from "@/types/generated";
```

### 2. Updating Existing Types

1. Modify Go struct
2. Regenerate types
3. Update frontend code if needed
4. Test the changes

### 3. Continuous Development

Use the watch mode for automatic regeneration:

```bash
make watch-types
```

Or use the full development workflow:

```bash
make dev-with-types
```

## Type Mappings

The system automatically maps Go types to TypeScript:

| Go Type           | TypeScript Type           |
| ----------------- | ------------------------- |
| `string`          | `string`                  |
| `int`, `uint`     | `number`                  |
| `bool`            | `boolean`                 |
| `time.Time`       | `string`                  |
| `uuid.UUID`       | `string`                  |
| `*string`         | `string \| null`          |
| `*bool`           | `boolean \| null`         |
| `interface{}`     | `unknown`                 |
| `json.RawMessage` | `Record<string, unknown>` |
| `gorm.DeletedAt`  | `string \| null`          |

## Best Practices

### 1. Go Code

- Always add `// tygo:emit` to structs that need TypeScript types
- Use proper JSON tags: `json:"fieldName"`
- Use pointer types for optional fields: `*string`
- Group related types in appropriate packages

### 2. TypeScript Usage

- Import from the consolidated index: `import { User } from '@/types/generated'`
- Use type guards for runtime validation
- Leverage the `cn` utility for conditional classes

### 3. Development

- Run `make test-types` after changes
- Use the enhanced generation script for production
- Keep backups are automatically created

## Troubleshooting

### Common Issues

1. **Types not generating**

   - Check if `// tygo:emit` comment is present
   - Verify tygo.yaml configuration
   - Run `make types-setup` to ensure environment is ready

2. **Import errors in TypeScript**

   - Check if the type exists in generated files
   - Verify import path: `@/types/generated`
   - Ensure TypeScript path mapping is configured

3. **Type mismatches**
   - Check Go struct JSON tags
   - Verify type mappings in tygo.yaml
   - Run post-processing script

### Validation Commands

```bash
# Test the complete system
make test-types

# Check specific files
ls -la client/src/types/generated/

# Validate TypeScript compilation
cd client && npx tsc --noEmit
```

## File Watching

For development, you can watch for Go file changes:

```bash
# macOS (requires fswatch)
brew install fswatch
make watch-types

# Linux (requires inotify-tools)
sudo apt-get install inotify-tools
make watch-types
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Generate and validate types
  run: |
    make types-setup
    make generate-types-enhanced
    make test-types
```

## Backup and Recovery

- Backups are automatically created in `client/src/types/backup/`
- Each generation creates a timestamped backup
- Restore manually if needed

## Performance

- Type generation typically takes 1-3 seconds
- Generated files are optimized for tree-shaking
- Import only what you need for better bundle size

## Future Enhancements

- [ ] OpenAPI integration
- [ ] Runtime type validation with Zod
- [ ] Automatic API client generation
- [ ] GraphQL schema generation
- [ ] Type versioning and migration tools
