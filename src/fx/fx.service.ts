import { Inject, Injectable } from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { subMinutes } from 'date-fns';
import { FxRate } from './entities/fx-rate.entity';
import { HttpService } from '@nestjs/axios';
import { CACHE_TTL_MINUTES } from './fx.constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
// import { HttpService } from '@nestjs/common'; // Corrected import

@Injectable()
export class FxService {
  constructor(
    @InjectRepository(FxRate) private fxRepo: Repository<FxRate>,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // async getRate(base: string, target: string): Promise<number> {
  //   const now = new Date();
  //   const validFrom = subMinutes(now, CACHE_TTL_MINUTES);

  //   const cached = await this.fxRepo.findOne({
  //     where: { base, target, fetchedAt: MoreThan(validFrom) },
  //     order: { fetchedAt: 'DESC' },
  //   });

  //   if (cached) return Number(cached.rate);

  //   const apiKey = this.configService.get('FX_API_KEY');
  //   const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

  //   const res = await this.http.axiosRef.get(url);
  //   const rate = res.data?.conversion_rates?.[target];

  //   if (!rate) throw new Error(`Rate for ${base}/${target} not found`);

  //   await this.fxRepo.save(this.fxRepo.create({ base, target, rate }));

  //   return rate;
  // }


  async getRate(base: string, target: string): Promise<number> {
    // Try Redis cache first
    const cacheKey = `fx_rate:${base}:${target}`;
    const cachedRate = await this.cacheManager.get<number>(cacheKey);
    
    if (cachedRate) {
      console.log('🔵 Cache HIT: Using Redis cached rate');
      return cachedRate;
    }

    console.log('🟡 Cache MISS: Checking database...');

    // Existing database check
    const now = new Date();
    const validFrom = subMinutes(now, CACHE_TTL_MINUTES);

    try {
      const cached = await this.fxRepo.findOne({
        where: { base, target, fetchedAt: MoreThan(validFrom) },
        order: { fetchedAt: 'DESC' },
      });

      if (cached) {
        console.log('🟢 DB HIT: Rate found in database');
        await this.cacheManager.set(cacheKey, Number(cached.rate), 60 * 5);
        return Number(cached.rate);
      }

      console.log('🔴 DB MISS: Fetching from API...');
      const apiKey = this.configService.get('FX_API_KEY');
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

      const res = await this.http.axiosRef.get(url);
      const rate = res.data?.conversion_rates?.[target];

      if (!rate) throw new Error(`Rate for ${base}/${target} not found`);

      const savedRate = await this.fxRepo.save(
        this.fxRepo.create({ base, target, rate })
      );
      console.log('💾 Saved new rate to database:', savedRate);

      await this.cacheManager.set(cacheKey, rate, 60 * 5);
      return rate;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
  }
  async getAllRates(base = 'NGN') {
    const apiKey = this.configService.get('FX_API_KEY');
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

    const res = await this.http.axiosRef.get(url);
    return res.data.conversion_rates;
  }
}