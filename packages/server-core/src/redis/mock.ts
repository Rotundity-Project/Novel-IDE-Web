import type { Redis } from "./types";

export function createMockRedis(): Redis {
  const store = new Map<string, string>();
  const sets = new Map<string, Set<string>>();

  return {
    connect: async () => {},
    quit: async () => {},
    get: async (key) => store.get(key) ?? null,
    set: async (key, value) => {
      store.set(key, value);
      return "OK";
    },
    del: async (keys) => {
      const list = Array.isArray(keys) ? keys : [keys];
      let deleted = 0;
      for (const key of list) {
        if (store.delete(key)) {
          deleted += 1;
        }
        if (sets.delete(key)) {
          deleted += 1;
        }
      }
      return deleted;
    },
    sAdd: async (key, member) => {
      const set = sets.get(key) ?? new Set<string>();
      const before = set.size;
      set.add(member);
      sets.set(key, set);
      return set.size > before ? 1 : 0;
    },
    sMembers: async (key) => Array.from(sets.get(key) ?? []),
    expire: async () => true,
  };
}

