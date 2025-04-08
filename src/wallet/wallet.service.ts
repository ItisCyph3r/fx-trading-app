/* eslint-disable prettier/prettier */
import {
    BadRequestException,
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, DataSource } from 'typeorm';
  import { Wallet } from './wallet.entity';
  import { User } from '../user/user.entity';
  import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransactionService } from 'src/transactions/transaction.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { FxService } from 'src/fx/entities/fx.service';
//   import { TransactionService } from '../transaction/transaction.service';
  
  @Injectable()
  export class WalletService {
    constructor(
      @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
      @InjectRepository(User) private userRepo: Repository<User>,
      private txService: TransactionService,
      private dataSource: DataSource,
      private fxService: FxService
    ) {}
  
    async getUserWallets(userId: string) {
      return await this.walletRepo.find({ where: { user: { id: userId } } });
    }
  
    async fundWallet(userId: string, dto: FundWalletDto) {
      if (dto.currency !== 'NGN') {
        throw new BadRequestException('Only NGN funding is supported');
      }
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
        const user = await queryRunner.manager.findOneOrFail(User, {
          where: { id: userId },
        });
  
        let wallet = await queryRunner.manager.findOne(Wallet, {
          where: { user: { id: userId }, currency: dto.currency },
        });
  
        if (!wallet) {
          wallet = this.walletRepo.create({
            user,
            currency: dto.currency,
            balance: 0,
          });
        }
  
        wallet.balance = Number(wallet.balance) + dto.amount;
        await queryRunner.manager.save(wallet);
  
        await this.txService.createTransaction(queryRunner, {
            user,
            amount: dto.amount,
            currency: dto.currency,
            type: 'FUNDING',
            status: 'SUCCESS',
            note: 'Wallet funded via NGN',
        });
  
        await queryRunner.commitTransaction();
        return { message: 'Wallet funded successfully', wallet };
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    async convertCurrency(userId: string, dto: ConvertCurrencyDto) {
        if (dto.fromCurrency === dto.toCurrency) {
          throw new BadRequestException('Cannot convert to same currency');
        }
      
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
      
        try {
          const user = await queryRunner.manager.findOneOrFail(User, {
            where: { id: userId },
          });
      
          const fromWallet = await queryRunner.manager.findOne(Wallet, {
            where: { user: { id: userId }, currency: dto.fromCurrency },
          });
      
          if (!fromWallet || Number(fromWallet.balance) < dto.amount) {
            throw new BadRequestException('Insufficient balance');
          }
      
          const rate = await this.fxService.getRate(dto.fromCurrency, dto.toCurrency);
          const convertedAmount = Number((dto.amount * rate).toFixed(4));
      
          let toWallet = await queryRunner.manager.findOne(Wallet, {
            where: { user: { id: userId }, currency: dto.toCurrency },
          });
      
          if (!toWallet) {
            toWallet = this.walletRepo.create({
              user,
              currency: dto.toCurrency,
              balance: 0,
            });
          }
      
          fromWallet.balance = Number(fromWallet.balance) - dto.amount;
          toWallet.balance = Number(toWallet.balance) + convertedAmount;
      
          await queryRunner.manager.save([fromWallet, toWallet]);
      
          await this.txService.createTransaction(queryRunner, {
            user,
            amount: dto.amount,
            currency: dto.fromCurrency,
            type: 'CONVERSION',
            status: 'SUCCESS',
            note: `Converted to ${convertedAmount} ${dto.toCurrency}`,
            fromCurrency: dto.fromCurrency,  // Add this
            toCurrency: dto.toCurrency,      // Add this
            rate: rate, // Add this   
          });
      
          await queryRunner.commitTransaction();
          return { message: 'Conversion successful', rate, convertedAmount };
        } catch (err) {
          await queryRunner.rollbackTransaction();
          throw err;
        } finally {
          await queryRunner.release();
        }
      }
      
  }
  