import { fileKv } from "./file-kv";

const kvStore = {
  async get<T>(key: string): Promise<T | null> {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_URL !== "https://redis-12345.upstash.io"
    ) {
      // Use actual Vercel KV if configured
      const { kv } = await import("@vercel/kv");
      return kv.get<T>(key);
    }
    // Use file-based KV for development
    return fileKv.get<T>(key);
  },

  async set(key: string, value: any): Promise<void> {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_URL !== "https://redis-12345.upstash.io"
    ) {
      // Use actual Vercel KV if configured
      const { kv } = await import("@vercel/kv");
      return kv.set(key, value);
    }
    // Use file-based KV for development
    fileKv.set(key, value);
  },

  async del(key: string): Promise<void> {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_URL !== "https://redis-12345.upstash.io"
    ) {
      // Use actual Vercel KV if configured
      const { kv } = await import("@vercel/kv");
      await kv.del(key);
      return;
    }
    // Use file-based KV for development
    fileKv.del(key);
  },

  async list<T>(): Promise<T[]> {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_URL !== "https://redis-12345.upstash.io"
    ) {
      // Vercel KV does not support listing all keys in a simple way.
      // This would need a more complex implementation, e.g. using a Set.
      return [];
    }
    // Use file-based KV for development
    return fileKv.list<T>();
  },
};

export default kvStore;
