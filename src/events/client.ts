import Redis from 'ioredis';

export const redisClient = new Redis(process.env.REDIS_URL!);

redisClient.on("connect", () => console.log("Redis client connected"));
redisClient.on("error", (err) => console.log("Redis Client Error", err));