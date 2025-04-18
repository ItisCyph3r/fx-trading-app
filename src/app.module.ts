import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtBlacklistGuard } from './common/guards/jwt-blacklist.guard';

// Import the necessary modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transactions/transaction.module';

// Import HttpModule from @nestjs/axios (NOT HttpService)
import { HttpModule } from '@nestjs/axios';
import { FxModule } from './fx/fx.module';
import * as crypto from 'crypto';
import { CacheModule } from '@nestjs/cache-manager';
import { redisConfig } from './config/redis.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: redisConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    WalletModule,
    FxModule,
    TransactionModule,
    HttpModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtBlacklistGuard,
    },
  ],
})
export class AppModule {}