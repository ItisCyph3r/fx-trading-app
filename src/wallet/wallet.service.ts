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
import { TransactionService } from '../transactions/transaction.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { FxService } from '../fx/fx.service';
import { TradeCurrencyDto, TradeSide } from './dto/trade.dto';
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
      // Validate currencies
      const supportedCurrencies = ['USD', 'NGN', 'EUR', 'GBP'];
      if (!supportedCurrencies.includes(dto.fromCurrency)) {
          throw new BadRequestException(`Unsupported currency: ${dto.fromCurrency}`);
      }
      if (!supportedCurrencies.includes(dto.toCurrency)) {
          throw new BadRequestException(`Unsupported currency: ${dto.toCurrency}`);
      }
  
      // Check if same currency
      if (dto.fromCurrency === dto.toCurrency) {
          throw new BadRequestException('Cannot convert to same currency');
      }
  
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
  
      try {
          // Get user
          const user = await queryRunner.manager.findOneOrFail(User, {
              where: { id: userId },
          });
  
          // Check source wallet
          const fromWallet = await queryRunner.manager.findOne(Wallet, {
              where: { user: { id: userId }, currency: dto.fromCurrency },
          });
  
          // Validate balance
          if (!fromWallet || Number(fromWallet.balance) < dto.amount) {
              throw new BadRequestException(`Insufficient ${dto.fromCurrency} balance`);
          }
  
          // Get conversion rate
          let rate;
          try {
              rate = await this.fxService.getRate(dto.fromCurrency, dto.toCurrency);
          } catch (error) {
              throw new BadRequestException(`Failed to get rate for ${dto.fromCurrency}/${dto.toCurrency}`);
          }
  
          // Calculate converted amount with 4 decimal precision
          const convertedAmount = Number((dto.amount * rate).toFixed(4));
  
          // Get or create destination wallet
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
  
          // Update balances
          fromWallet.balance = Number(fromWallet.balance) - dto.amount;
          toWallet.balance = Number(toWallet.balance) + convertedAmount;
  
          // Save wallet changes
          await queryRunner.manager.save([fromWallet, toWallet]);
  
          // Record transaction
          await this.txService.createTransaction(queryRunner, {
              user,
              amount: dto.amount,
              currency: dto.fromCurrency,
              type: 'CONVERSION',
              status: 'SUCCESS',
              note: `Converted ${dto.amount} ${dto.fromCurrency} to ${convertedAmount} ${dto.toCurrency}`,
              fromCurrency: dto.fromCurrency,
              toCurrency: dto.toCurrency,
              rate: rate,
          });
  
          // Commit transaction
          await queryRunner.commitTransaction();
  
          return {
              message: 'Conversion successful',
              rate,
              fromAmount: dto.amount,
              toAmount: convertedAmount,
              fromCurrency: dto.fromCurrency,
              toCurrency: dto.toCurrency
          };
      } catch (err) {
          // Rollback on error
          await queryRunner.rollbackTransaction();
          if (err instanceof BadRequestException) {
              throw err;
          }
          throw new BadRequestException(err.message || 'Currency conversion failed');
      } finally {
          // Release resources
          await queryRunner.release();
      }
  }


    async tradeCurrency(userId: string, dto: TradeCurrencyDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await queryRunner.manager.findOneOrFail(User, {
                where: { id: userId },
            });

            // Get current market rate
            const rate = await this.fxService.getRate(dto.baseCurrency, dto.quoteCurrency);
            
            // Add spread for trading (e.g., 2%)
            const spread = 0.02;
            const adjustedRate = dto.side === TradeSide.BUY 
                ? rate * (1 + spread)  // User pays more when buying
                : rate * (1 - spread); // User gets less when selling

            // Calculate amounts
            const baseAmount = dto.amount;
            const quoteAmount = Number((baseAmount * adjustedRate).toFixed(4));

            // Determine which wallet to debit/credit based on trade side
            const [fromCurrency, toCurrency] = dto.side === TradeSide.BUY 
                ? [dto.quoteCurrency, dto.baseCurrency]
                : [dto.baseCurrency, dto.quoteCurrency];

            const [debitAmount, creditAmount] = dto.side === TradeSide.BUY
                ? [quoteAmount, baseAmount]
                : [baseAmount, quoteAmount];

            // Get or create wallets
            let fromWallet = await queryRunner.manager.findOne(Wallet, {
                where: { user: { id: userId }, currency: fromCurrency },
            });

            let toWallet = await queryRunner.manager.findOne(Wallet, {
                where: { user: { id: userId }, currency: toCurrency },
            });

            // Validate balances
            if (!fromWallet || Number(fromWallet.balance) < debitAmount) {
                throw new BadRequestException(`Insufficient ${fromCurrency} balance`);
            }

            if (!toWallet) {
                toWallet = this.walletRepo.create({
                    user,
                    currency: toCurrency,
                    balance: 0,
                });
            }

            // Update balances
            fromWallet.balance = Number(fromWallet.balance) - debitAmount;
            toWallet.balance = Number(toWallet.balance) + creditAmount;

            // Save wallet changes
            await queryRunner.manager.save([fromWallet, toWallet]);

            // Create transaction record
            await this.txService.createTransaction(queryRunner, {
                user,
                amount: baseAmount,
                currency: dto.baseCurrency,
                type: 'TRADE',
                status: 'SUCCESS',
                fromCurrency,
                toCurrency,
                rate: adjustedRate,
                note: `${dto.side} ${baseAmount} ${dto.baseCurrency} at ${adjustedRate} ${dto.quoteCurrency}`,
            });

            await queryRunner.commitTransaction();

            return {
                message: 'Trade executed successfully',
                side: dto.side,
                baseAmount,
                quoteAmount,
                rate: adjustedRate,
            };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
      
  }
  















