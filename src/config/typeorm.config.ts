import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Be careful with this in production
  ssl: {
    rejectUnauthorized: false // Required for Render.com PostgreSQL
  },
  extra: {
    // Connection pool settings
    max: 20,
    connectionTimeoutMillis: 10000
  },
  retryAttempts: 10,
  retryDelay: 3000,
  autoLoadEntities: true,
  logging: true // Enable logging to see SQL queries
});