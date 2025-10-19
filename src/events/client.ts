import Redis from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL!);

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (redisClient.status !== 'ready') {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
};

export const disconnectRedis = async () => {
  if (redisClient.status === 'ready') {
    redisClient.disconnect();
    console.log('Disconnected from Redis');
  }
};

export const getRedisInfo = async () => {
  if (redisClient.status === 'ready') {
    const info = await redisClient.info();
    console.log('Redis Info:', info);
    return info;
  } else {
    console.log('Redis client is not connected.');
    return null;
  }
};