import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';

// Import the necessary modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
// import { FxModule } from './fx/fx.module';
import { TransactionModule } from './transactions/transaction.module';

// Import HttpModule from @nestjs/axios (NOT HttpService)
import { HttpModule } from '@nestjs/axios';
import { FxModule } from './fx/fx.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    AuthModule,
    UserModule,
    WalletModule,
    FxModule,
    TransactionModule,
    
    // Add HttpModule here
    HttpModule,
  ],
})
export class AppModule {}
