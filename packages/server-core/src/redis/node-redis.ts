import { createClient } from "redis";
import type { Redis } from "./types";

export function createNodeRedis(redisUrl: string): Redis {
  const client = createClient({ url: redisUrl });

  return {
    connect: async () => {
      await client.connect();
    },
    quit: async () => {
      await client.quit();
    },
    get: async (key) => client.get(key),
    set: async (key, value, options) => {
      if (options) {
        return client.set(key, value, options);
      }
      return client.set(key, value);
    },
    del: async (keys) => {
      if (Array.isArray(keys)) {
        return client.del(keys);
      }
      return client.del(keys);
    },
    sAdd: async (key, member) => client.sAdd(key, member),
    sMembers: async (key) => client.sMembers(key),
    expire: async (key, seconds) => {
      const result = await client.expire(key, seconds);
      return result;
    },
  };
}

