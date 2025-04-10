import { Test, TestingModule } from '@nestjs/testing';
import { FxService } from './fx.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FxRate } from './entities/fx-rate.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockFxRate } from '../test/mock/index';

describe('FxService', () => {
  let service: FxService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
  };

  const mockHttpService = {
    axiosRef: {
      get: jest.fn()
    }
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        {
          provide: getRepositoryToken(FxRate),
          useValue: mockRepository
        },
        {
          provide: HttpService,
          useValue: mockHttpService
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => 'test-api-key') }
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager
        }
      ],
    }).compile();

    service = module.get<FxService>(FxService);
  });

  describe('getRate', () => {
    it('should return cached rate if available', async () => {
      mockCacheManager.get.mockResolvedValue(780.50);

      const result = await service.getRate('USD', 'NGN');

      expect(result).toBe(780.50);
      expect(mockCacheManager.get).toHaveBeenCalledWith('fx_rate:USD:NGN');
    });

    it('should fetch from database if cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockFxRate);

      const result = await service.getRate('USD', 'NGN');

      expect(result).toBe(mockFxRate.rate);
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should fetch from API if no cached or database rate', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);
      mockHttpService.axiosRef.get.mockResolvedValue({
        data: {
          conversion_rates: {
            NGN: 780.50
          }
        }
      });

      const result = await service.getRate('USD', 'NGN');

      expect(result).toBe(780.50);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getAllRates', () => {
    it('should return all rates for base currency', async () => {
      const mockRates = {
        USD: 1,
        NGN: 780.50,
        EUR: 0.85
      };

      mockHttpService.axiosRef.get.mockResolvedValue({
        data: {
          conversion_rates: mockRates
        }
      });

      const result = await service.getAllRates('USD');

      expect(result).toEqual(mockRates);
    });
  });
});