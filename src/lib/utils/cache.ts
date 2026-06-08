// src/lib/utils/cache.ts
import Redis from 'ioredis'

let redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    })
    redisClient.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[Redis] error:', err.message)
      }
    })
  }
  return redisClient
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await getRedis().get(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    try {
      await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch {
      // fail silently — cache is best-effort
    }
  },

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 60
  ): Promise<T> {
    const cached = await cache.get<T>(key)
    if (cached !== null) return cached
    const fresh = await fetcher()
    await cache.set(key, fresh, ttlSeconds)
    return fresh
  },

  async del(key: string): Promise<void> {
    try {
      await getRedis().del(key)
    } catch {}
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await getRedis().keys(pattern)
      if (keys.length > 0) await getRedis().del(...keys)
    } catch {}
  },

  async flush(): Promise<void> {
    try {
      await getRedis().flushdb()
    } catch {}
  },
}
