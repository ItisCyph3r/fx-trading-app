import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './wallet.entity';
import { TransactionModule } from '../transactions/transaction.module';
import { UserModule } from '../user/user.module';
import { FxModule } from 'src/fx/fx.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    UserModule, // Add this line
    TransactionModule,
    FxModule,
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService, TypeOrmModule],
})
export class WalletModule {}