import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './wallet.entity';
import { TransactionModule } from 'src/transactions/transaction.module';
import { FxModule } from 'src/fx/entities/fx.module';
// import { TransactionModule } from '../transaction/transaction.module';
// import { FxModule } from '../fx/fx.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    TransactionModule,
    FxModule,
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
