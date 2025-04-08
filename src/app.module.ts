// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}


import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';

// import { AuthModule } from './auth/auth.module';
// import { UserModule } from './user/user.module';
// import { WalletModule } from './wallet/wallet.module';
// import { FxModule } from './fx/fx.module';
// import { TradeModule } from './trade/trade.module';
// import { TransactionModule } from './transaction/transaction.module';
import { HttpService } from '@nestjs/axios';
import { FxModule } from './fx/entities/fx.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transactions/transaction.module';

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
    // TradeModule,
    TransactionModule,
    HttpService
  ],
})
export class AppModule {}
