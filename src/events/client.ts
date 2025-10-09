import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
};

export const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    redisClient.destroy();
    console.log('Disconnected from Redis');
  }
};

export const getRedisInfo = async () => {
  if (redisClient.isOpen) {
    const info = await redisClient.info();
    console.log('Redis Info:', info);
    return info;
  } else {
    console.log('Redis client is not connected.');
    return null;
  }
};