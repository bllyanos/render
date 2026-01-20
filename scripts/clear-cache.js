import { createClient } from 'redis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

async function clearCache() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`🔌 Connecting to Redis at ${redisUrl}...`);

  const client = createClient({
    url: redisUrl
  });

  client.on('error', (err) => console.error('Redis Client Error', err));

  try {
    await client.connect();
    console.log('✅ Connected to Redis');

    // 1. Clear Index Cache
    const indexKey = 'render:index';
    const indexResult = await client.del(indexKey);
    if (indexResult) {
        console.log('🗑️  Index cache cleared.');
    } else {
        console.log('ℹ️  Index cache was empty.');
    }

    // 2. Clear Pages Cache
    let cursor = '0';
    let pagesCleared = 0;
    do {
      const reply = await client.scan(cursor, { MATCH: 'render:page:*', COUNT: 100 });
      cursor = reply.cursor.toString();
      const keys = reply.keys;
      
      if (keys.length > 0) {
        const deletedCount = await client.del(keys);
        pagesCleared += deletedCount;
      }
    } while (cursor !== '0');

    console.log(`🗑️  Cleared ${pagesCleared} page(s) from cache.`);
    console.log('✨ All caches cleared successfully.');

  } catch (err) {
    console.error('❌ Error clearing cache:', err);
    process.exit(1);
  } finally {
    await client.disconnect();
    console.log('🔌 Disconnected from Redis');
  }
}

if (process.argv[1] === __filename) {
  clearCache().catch(err => {
    console.error('❌ Script execution failed:', err);
    process.exit(1);
  });
}

export default clearCache;
