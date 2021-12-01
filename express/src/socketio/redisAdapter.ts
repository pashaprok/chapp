import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisConfig } from '../config/redisConfig';

const pubClient = createClient({
  url: `redis://${redisConfig.host}:${redisConfig.port}/0`,
});

const subClient = pubClient.duplicate();

export default createAdapter(pubClient, subClient);
