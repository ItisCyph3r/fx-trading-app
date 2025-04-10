import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Wallet } from './wallet.entity';
import { User } from '../user/user.entity';
import { TransactionService } from '../transactions/transaction.service';
import { FxService } from '../fx/fx.service';
import { BadRequestException } from '@nestjs/common';
import { mockUser, mockWallet, mockTransaction } from '../test/mock/index';
import { TradeSide } from './dto/trade.dto';

describe('WalletService', () => {
  let service: WalletService;
  let dataSource: DataSource;
  let transactionService: TransactionService;
  let fxService: FxService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn()
    }
  };

  const mockRepositories = {
    wallet: {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn()
    },
    user: {
      findOne: jest.fn()
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockRepositories.wallet
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepositories.user
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner)
          }
        },
        {
          provide: TransactionService,
          useValue: {
            createTransaction: jest.fn().mockResolvedValue(mockTransaction)
          }
        },
        {
          provide: FxService,
          useValue: {
            getRate: jest.fn().mockResolvedValue(780.50)
          }
        }
      ]
    }).compile();

    service = module.get<WalletService>(WalletService);
    dataSource = module.get<DataSource>(DataSource);
    transactionService = module.get<TransactionService>(TransactionService);
    fxService = module.get<FxService>(FxService);
  });

  describe('getUserWallets', () => {
    it('should return user wallets', async () => {
      mockRepositories.wallet.find.mockResolvedValue([mockWallet]);

      const result = await service.getUserWallets(mockUser.id);

      expect(result).toEqual([mockWallet]);
      expect(mockRepositories.wallet.find).toHaveBeenCalledWith({
        where: { user: { id: mockUser.id } }
      });
    });
  });

  describe('fundWallet', () => {
    const fundDto = {
      currency: 'NGN',
      amount: 1000
    };

    it('should fund wallet successfully', async () => {
      mockQueryRunner.manager.findOneOrFail.mockResolvedValue(mockUser);
      mockQueryRunner.manager.findOne.mockResolvedValue({
        ...mockWallet,
        balance: 1000
      });
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockWallet,
        balance: 2000
      });

      const result = await service.fundWallet(mockUser.id, fundDto);

      expect(result).toHaveProperty('message', 'Wallet funded successfully');
      expect(result).toHaveProperty('wallet');
      expect(result.wallet.balance).toBe(2000);
    });

    it('should throw if currency is not NGN', async () => {
      await expect(
        service.fundWallet(mockUser.id, { ...fundDto, currency: 'USD' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('convertCurrency', () => {
    const convertDto = {
      fromCurrency: 'NGN',
      toCurrency: 'USD',
      amount: 1000
    };

    it('should convert currency successfully', async () => {
      mockQueryRunner.manager.findOneOrFail.mockResolvedValue(mockUser);
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({
          ...mockWallet,
          balance: 2000,
          currency: 'NGN'
        })
        .mockResolvedValueOnce({
          ...mockWallet,
          balance: 0,
          currency: 'USD'
        });

      const result = await service.convertCurrency(mockUser.id, convertDto);

      expect(result).toHaveProperty('message', 'Conversion successful');
      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('convertedAmount');
    });

    it('should throw if converting to same currency', async () => {
      await expect(
        service.convertCurrency(mockUser.id, {
          ...convertDto,
          toCurrency: 'NGN'
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if insufficient balance', async () => {
      mockQueryRunner.manager.findOneOrFail.mockResolvedValue(mockUser);
      mockQueryRunner.manager.findOne.mockResolvedValue({
        ...mockWallet,
        balance: 500
      });

      await expect(
        service.convertCurrency(mockUser.id, convertDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('tradeCurrency', () => {
    const tradeDto = {
      baseCurrency: 'NGN',
      quoteCurrency: 'USD',
      amount: 1000,
      side: TradeSide.BUY
    };

    it('should execute buy trade successfully', async () => {
      mockQueryRunner.manager.findOneOrFail.mockResolvedValue(mockUser);
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({
          ...mockWallet,
          balance: 2000,
          currency: 'NGN'
        })
        .mockResolvedValueOnce({
          ...mockWallet,
          balance: 0,
          currency: 'USD'
        });

      const result = await service.tradeCurrency(mockUser.id, tradeDto);

      expect(result).toHaveProperty('message', 'Trade executed successfully');
      expect(result).toHaveProperty('side', TradeSide.BUY);
      expect(result).toHaveProperty('baseAmount');
      expect(result).toHaveProperty('quoteAmount');
      expect(result).toHaveProperty('rate');
    });

    it('should execute sell trade successfully', async () => {
      mockQueryRunner.manager.findOneOrFail.mockResolvedValue(mockUser);
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({
          ...mockWallet,
          balance: 1000,
          currency: 'NGN'
        })
        .mockResolvedValueOnce({
          ...mockWallet,
          currency: 'USD',
          balance: 100
        });

      const result = await service.tradeCurrency(mockUser.id, {
        ...tradeDto,
        side: TradeSide.SELL
      });

      expect(result).toHaveProperty('message', 'Trade executed successfully');
      expect(result).toHaveProperty('side', TradeSide.SELL);
    });

    it('should throw if insufficient balance for trade', async () => {
      mockQueryRunner.manager.findOneOrFail.mockResolvedValue(mockUser);
      mockQueryRunner.manager.findOne.mockResolvedValue({
        ...mockWallet,
        balance: 500
      });

      await expect(
        service.tradeCurrency(mockUser.id, tradeDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});