package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// Cache interface defines caching operations
type Cache interface {
	Get(ctx context.Context, key string) ([]byte, error)
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	Flush(ctx context.Context) error
}

// RedisCache implements Cache interface using Redis
// This is a placeholder for Redis implementation
// In a real implementation, you would use github.com/go-redis/redis/v8
type RedisCache struct {
	// Redis client would be implemented here
}

// NewRedisCache creates a new Redis cache instance
func NewRedisCache(addr, password string, db int) *RedisCache {
	// Redis implementation would go here
	return &RedisCache{}
}

// Get retrieves a value from cache
func (c *RedisCache) Get(ctx context.Context, key string) ([]byte, error) {
	// Redis implementation would go here
	return nil, fmt.Errorf("redis not implemented")
}

// Set stores a value in cache
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	// Redis implementation would go here
	return fmt.Errorf("redis not implemented")
}

// Delete removes a key from cache
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	// Redis implementation would go here
	return fmt.Errorf("redis not implemented")
}

// Exists checks if a key exists in cache
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	// Redis implementation would go here
	return false, fmt.Errorf("redis not implemented")
}

// Flush clears all keys from cache
func (c *RedisCache) Flush(ctx context.Context) error {
	// Redis implementation would go here
	return fmt.Errorf("redis not implemented")
}

// Close closes the Redis connection
func (c *RedisCache) Close() error {
	// Redis implementation would go here
	return fmt.Errorf("redis not implemented")
}

// MemoryCache implements Cache interface using in-memory storage
type MemoryCache struct {
	data map[string]cacheItem
	mu   sync.RWMutex
}

type cacheItem struct {
	value      []byte
	expiration time.Time
}

// NewMemoryCache creates a new in-memory cache instance
func NewMemoryCache() *MemoryCache {
	return &MemoryCache{
		data: make(map[string]cacheItem),
	}
}

// Get retrieves a value from memory cache
func (c *MemoryCache) Get(ctx context.Context, key string) ([]byte, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.data[key]
	if !exists {
		return nil, fmt.Errorf("key not found: %s", key)
	}

	if time.Now().After(item.expiration) {
		delete(c.data, key)
		return nil, fmt.Errorf("key expired: %s", key)
	}

	return item.value, nil
}

// Set stores a value in memory cache
func (c *MemoryCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	var data []byte
	var err error

	switch v := value.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		data, err = json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value: %w", err)
		}
	}

	c.data[key] = cacheItem{
		value:      data,
		expiration: time.Now().Add(expiration),
	}

	return nil
}

// Delete removes a key from memory cache
func (c *MemoryCache) Delete(ctx context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, key)
	return nil
}

// Exists checks if a key exists in memory cache
func (c *MemoryCache) Exists(ctx context.Context, key string) (bool, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.data[key]
	if !exists {
		return false, nil
	}

	if time.Now().After(item.expiration) {
		delete(c.data, key)
		return false, nil
	}

	return true, nil
}

// Flush clears all keys from memory cache
func (c *MemoryCache) Flush(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data = make(map[string]cacheItem)
	return nil
}

// CacheKey generates a consistent cache key
func CacheKey(prefix string, parts ...interface{}) string {
	key := prefix
	for _, part := range parts {
		key += fmt.Sprintf(":%v", part)
	}
	return key
}
