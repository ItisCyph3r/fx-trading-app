import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const redisConfig = async (
  configService: ConfigService,
): Promise<CacheModuleOptions> => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  
  return {
    store: redisStore,
    host: isProduction ? 'redis' : configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    username: configService.get('REDIS_USERNAME'),
    password: configService.get('REDIS_PASSWORD'),
    ttl: 60 * 60 * 24,
  };
};