import { Test, TestingModule } from '@nestjs/testing';
// import { TransactionService } from './transaction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../transactions/transaction.entity';
import { mockTransaction } from '../test/mock/index';
import { Between, ILike } from 'typeorm';
import { TransactionService } from '../transactions/transaction.service';

describe('TransactionService', () => {
  let service: TransactionService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository
        }
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  describe('getUserTransactions', () => {
    const query = {
      type: TransactionType.FUNDING,
      currency: 'NGN',
      from: '2025-01-01',
      to: '2025-12-31',
      page: 1,
      limit: 10
    };

    it('should return transactions with pagination', async () => {
      mockRepository.findAndCount.mockResolvedValue([[mockTransaction], 1]);

      const result = await service.getUserTransactions('user-123', query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
      expect(result.meta).toHaveProperty('totalPages');
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          user: { id: 'user-123' },
          type: TransactionType.FUNDING,
          currency: ILike('NGN'),
          createdAt: Between(new Date('2025-01-01'), new Date('2025-12-31'))
        },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
        relations: ['user']
      });
    });

    it('should handle empty results', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getUserTransactions('user-123', query);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should handle error during query', async () => {
      mockRepository.findAndCount.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserTransactions('user-123', query))
        .rejects
        .toThrow('Database error');
    });

    it('should handle partial query parameters', async () => {
      const partialQuery = {
        type: TransactionType.FUNDING,
        page: 1,
        limit: 10
      };

      mockRepository.findAndCount.mockResolvedValue([[mockTransaction], 1]);

      const result = await service.getUserTransactions('user-123', partialQuery);

      expect(result).toHaveProperty('data');
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: { id: 'user-123' },
            type: TransactionType.FUNDING
          })
        })
      );
    });
  });

  describe('createTransaction', () => {
    const transactionDetails = {
      type: TransactionType.FUNDING,
      amount: 1000,
      currency: 'NGN',
      user: { id: 'user-123' },
      status: TransactionStatus.SUCCESS
    };

    it('should create transaction successfully', async () => {
      const mockQueryRunner = {
        manager: {
          save: jest.fn().mockResolvedValue(mockTransaction)
        }
      };

      mockRepository.create.mockReturnValue(mockTransaction);

      const result = await service.createTransaction(
        mockQueryRunner,
        transactionDetails
      );

      expect(result).toEqual(mockTransaction);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...transactionDetails,
        status: TransactionStatus.SUCCESS,
        createdAt: expect.any(Date)
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        Transaction,
        mockTransaction
      );
    });

    it('should handle transaction creation error', async () => {
      const mockQueryRunner = {
        manager: {
          save: jest.fn().mockRejectedValue(new Error('Save failed'))
        }
      };

      mockRepository.create.mockReturnValue(mockTransaction);

      await expect(
        service.createTransaction(mockQueryRunner, transactionDetails)
      ).rejects.toThrow('Save failed');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});