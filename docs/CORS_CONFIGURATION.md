# CORS Configuration Guide

## Overview

The CORS (Cross-Origin Resource Sharing) middleware has been updated to use environment variables for configuration, making it flexible for different deployment environments.

## Environment Variables

### CORS_ALLOWED_ORIGINS

**Description**: Comma-separated list of allowed origins for CORS requests.

**Default**: `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173`

**Examples**:

```bash
# Development (multiple local origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# Production (specific domains)
CORS_ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com

# Staging
CORS_ALLOWED_ORIGINS=https://staging.myapp.com,https://dev.myapp.com
```

### Other CORS Variables

| Variable                 | Description                               | Default                                                                                                                                                            |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CORS_METHODS`           | Allowed HTTP methods                      | `GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS`                                                                                                                           |
| `CORS_HEADERS`           | Allowed request headers                   | `Origin,Content-Length,Content-Type,Authorization,X-Requested-With,Accept,Accept-Encoding,Accept-Language,Cache-Control,Connection,Host,Pragma,Referer,User-Agent` |
| `CORS_EXPOSED_HEADERS`   | Headers exposed to frontend               | `Content-Length,Content-Type,Authorization`                                                                                                                        |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials (cookies, auth headers) | `true`                                                                                                                                                             |
| `CORS_MAX_AGE`           | Cache preflight requests (seconds)        | `43200` (12 hours)                                                                                                                                                 |

## Configuration Examples

### .env File Example

```bash
# CORS Configuration for Development
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS
CORS_HEADERS=Origin,Content-Length,Content-Type,Authorization,X-Requested-With,Accept
CORS_EXPOSED_HEADERS=Content-Length,Content-Type,Authorization
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=43200
```

### Production Configuration

```bash
# CORS Configuration for Production
CORS_ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_HEADERS=Origin,Content-Length,Content-Type,Authorization,X-Requested-With
CORS_EXPOSED_HEADERS=Content-Length,Authorization
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=86400
```

## Usage in Code

### Current Implementation

The CORS middleware now automatically uses the configuration from environment variables:

```go
// In routes.go
func SetupCleanRoutes(router *gin.Engine, container *container.Container) {
    // CORS middleware automatically uses config from environment
    router.Use(middleware.CORS(container.Config))

    // ... rest of routes
}
```

### Backward Compatibility

If you need to use hardcoded defaults (not recommended), you can use:

```go
router.Use(middleware.CORSWithDefaults())
```

## Frontend Integration

### React/Vite Development

For local development with Vite (default port 5173):

```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### React/CRA Development

For local development with Create React App (default port 3000):

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Multiple Frontend Apps

If you have multiple frontend applications:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080,https://myapp.com
```

## Security Considerations

### Production Settings

- **Specific Origins**: Never use wildcards (`*`) in production
- **HTTPS Only**: Always use HTTPS origins in production
- **Minimal Headers**: Only expose necessary headers
- **Credentials**: Only allow credentials if absolutely necessary

### Example Production .env

```bash
CORS_ALLOWED_ORIGINS=https://myapp.com
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Origin,Content-Type,Authorization
CORS_EXPOSED_HEADERS=Content-Length
CORS_ALLOW_CREDENTIALS=false
CORS_MAX_AGE=86400
```

## Troubleshooting

### Common CORS Errors

1. **"No 'Access-Control-Allow-Origin' header"**

   - Check that your frontend origin is in `CORS_ALLOWED_ORIGINS`
   - Ensure no trailing slashes in origins

2. **"Request header field Authorization is not allowed"**

   - Add `Authorization` to `CORS_HEADERS`

3. **"Credentials flag is 'true', but the 'Access-Control-Allow-Origin' header is '\*'"**
   - When `CORS_ALLOW_CREDENTIALS=true`, you cannot use wildcard origins

### Debug CORS Issues

1. Check server logs for CORS-related messages
2. Use browser developer tools to inspect preflight OPTIONS requests
3. Verify environment variables are loaded correctly

### Testing CORS Configuration

You can test CORS configuration with curl:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost:8080/api/auth/login

# Test actual request
curl -X POST \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"userName":"test","password":"test"}' \
  -v http://localhost:8080/api/auth/login
```

## Migration from Hardcoded Origins

If you're migrating from hardcoded origins, simply set the `CORS_ALLOWED_ORIGINS` environment variable with your desired origins, and the middleware will automatically use them instead of the hardcoded defaults.
