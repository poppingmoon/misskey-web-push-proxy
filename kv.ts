export async function openKv(): Promise<Kv> {
  return new Kv(
    await Deno.openKv(),
    await caches.open("kv-cache"),
  );
}

export class Kv {
  kv: Deno.Kv;
  cache: Cache;

  constructor(kv: Deno.Kv, cache: Cache) {
    this.kv = kv;
    this.cache = cache;
  }

  async get<T = unknown>(key: Deno.KvKey): Promise<Deno.KvEntryMaybe<T>> {
    const cached = await this.cache.match(new URL(key.toString(), "http://kv"));
    if (cached) {
      return {
        key,
        value: await cached.json(),
        versionstamp: null,
      };
    }
    const result = await this.kv.get<T>(key);
    if (result.value) {
      await this.cache.put(
        new URL(key.toString(), "http://kv"),
        new Response(JSON.stringify(result.value)),
      );
    }
    return result;
  }

  async set(
    key: Deno.KvKey,
    value: unknown,
    options?: { expireIn?: number },
  ) {
    await this.kv.set(key, value, options);
    await this.cache.put(
      new URL(key.toString(), "http://kv"),
      new Response(JSON.stringify(value)),
    );
  }

  async delete(key: Deno.KvKey) {
    await this.kv.delete(key);
    await this.cache.put(new URL(key.toString(), "http://kv"), new Response());
  }
}
