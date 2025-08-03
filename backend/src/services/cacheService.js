const Redis = require('ioredis');
const { logInfo, logError } = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour in seconds
    this.initializeRedis();
  }

  // Initialize Redis connection
  async initializeRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      // Handle connection events
      this.redis.on('connect', () => {
        this.isConnected = true;
        logInfo('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logError(error, 'Redis connection error');
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logInfo('Redis connection closed');
      });

      this.redis.on('reconnecting', () => {
        logInfo('Redis reconnecting...');
      });

      // Connect to Redis
      await this.redis.connect();

    } catch (error) {
      logError(error, 'Failed to initialize Redis');
      this.redis = null;
      this.isConnected = false;
    }
  }

  // Set cache value
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.redis.setex(key, ttl, serializedValue);

      logInfo(`Cache set: ${key}`, { ttl });
      return true;

    } catch (error) {
      logError(error, `Error setting cache: ${key}`);
      return false;
    }
  }

  // Get cache value
  async get(key) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.redis.get(key);
      
      if (value === null) {
        return null;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }

    } catch (error) {
      logError(error, `Error getting cache: ${key}`);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.del(key);
      logInfo(`Cache deleted: ${key}`);
      return result > 0;

    } catch (error) {
      logError(error, `Error deleting cache: ${key}`);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result > 0;

    } catch (error) {
      logError(error, `Error checking cache existence: ${key}`);
      return false;
    }
  }

  // Set cache with hash
  async hset(hash, field, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.redis.hset(hash, field, serializedValue);
      await this.redis.expire(hash, ttl);

      logInfo(`Cache hset: ${hash}:${field}`, { ttl });
      return true;

    } catch (error) {
      logError(error, `Error setting hash cache: ${hash}:${field}`);
      return false;
    }
  }

  // Get cache from hash
  async hget(hash, field) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.redis.hget(hash, field);
      
      if (value === null) {
        return null;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }

    } catch (error) {
      logError(error, `Error getting hash cache: ${hash}:${field}`);
      return null;
    }
  }

  // Get all fields from hash
  async hgetall(hash) {
    try {
      if (!this.isConnected) {
        return {};
      }

      const hashData = await this.redis.hgetall(hash);
      const result = {};

      for (const [key, value] of Object.entries(hashData)) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }

      return result;

    } catch (error) {
      logError(error, `Error getting all hash cache: ${hash}`);
      return {};
    }
  }

  // Delete field from hash
  async hdel(hash, field) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.hdel(hash, field);
      logInfo(`Cache hdel: ${hash}:${field}`);
      return result > 0;

    } catch (error) {
      logError(error, `Error deleting hash cache: ${hash}:${field}`);
      return false;
    }
  }

  // Set cache with list
  async lpush(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.redis.lpush(key, serializedValue);
      await this.redis.expire(key, ttl);

      logInfo(`Cache lpush: ${key}`, { ttl });
      return true;

    } catch (error) {
      logError(error, `Error pushing to list cache: ${key}`);
      return false;
    }
  }

  // Get list from cache
  async lrange(key, start = 0, stop = -1) {
    try {
      if (!this.isConnected) {
        return [];
      }

      const values = await this.redis.lrange(key, start, stop);
      
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });

    } catch (error) {
      logError(error, `Error getting list cache: ${key}`);
      return [];
    }
  }

  // Increment counter
  async incr(key, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const result = await this.redis.incr(key);
      await this.redis.expire(key, ttl);

      return result;

    } catch (error) {
      logError(error, `Error incrementing cache: ${key}`);
      return 0;
    }
  }

  // Set cache with expiration
  async setex(key, value, ttl) {
    return await this.set(key, value, ttl);
  }

  // Get TTL of key
  async ttl(key) {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.redis.ttl(key);

    } catch (error) {
      logError(error, `Error getting TTL: ${key}`);
      return -1;
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        logInfo(`Cache cleared pattern: ${pattern}`, { keys_deleted: result });
        return result;
      }

      return 0;

    } catch (error) {
      logError(error, `Error clearing cache pattern: ${pattern}`);
      return 0;
    }
  }

  // Clear all cache
  async clearAll() {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.redis.flushdb();
      logInfo('All cache cleared');
      return true;

    } catch (error) {
      logError(error, 'Error clearing all cache');
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          keys: 0,
          memory: 0
        };
      }

      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();

      // Parse memory info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : '0B';

      return {
        connected: this.isConnected,
        keys,
        memory,
        timestamp: new Date()
      };

    } catch (error) {
      logError(error, 'Error getting cache statistics');
      return {
        connected: this.isConnected,
        keys: 0,
        memory: '0B',
        error: error.message
      };
    }
  }

  // Cache middleware for Express
  cacheMiddleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      const cacheKey = keyGenerator ? keyGenerator(req) : `api:${req.method}:${req.originalUrl}`;
      
      try {
        const cachedResponse = await this.get(cacheKey);
        
        if (cachedResponse) {
          return res.json(cachedResponse);
        }

        // Store original send method
        const originalSend = res.json;
        
        // Override send method to cache response
        res.json = function(data) {
          this.set(cacheKey, data, ttl);
          return originalSend.call(this, data);
        }.bind(this);

        next();

      } catch (error) {
        logError(error, 'Cache middleware error');
        next();
      }
    };
  }

  // Close Redis connection
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.isConnected = false;
        logInfo('Redis connection closed');
      }
    } catch (error) {
      logError(error, 'Error closing Redis connection');
    }
  }
}

module.exports = new CacheService(); 