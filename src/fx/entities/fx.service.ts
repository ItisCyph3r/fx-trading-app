// import { Injectable, HttpService, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FxRate } from './entities/fx-rate.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_TTL_MINUTES } from './fx.constants';
import { subMinutes } from 'date-fns';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FxService {
  constructor(
    @InjectRepository(FxRate) private fxRepo: Repository<FxRate>,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getRate(base: string, target: string): Promise<number> {
    const now = new Date();
    const validFrom = subMinutes(now, CACHE_TTL_MINUTES);

    // Check DB for a fresh cached rate
    const cached = await this.fxRepo.findOne({
      where: { base, target, fetchedAt: MoreThan(validFrom) },
      order: { fetchedAt: 'DESC' },
    });

    if (cached) return Number(cached.rate);

    // Fallback: fetch from exchangerate-api.com
    const apiKey = this.configService.get('FX_API_KEY');
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

    const res = await this.http.axiosRef.get(url);
    const rate = res.data?.conversion_rates?.[target];

    if (!rate) throw new Error(`Rate for ${base}/${target} not found`);

    // Save to DB for caching
    await this.fxRepo.save(
      this.fxRepo.create({ base, target, rate }),
    );

    return rate;
  }

  async getAllRates(base = 'NGN') {
    const apiKey = this.configService.get('FX_API_KEY');
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

    const res = await this.http.axiosRef.get(url);
    return res.data.conversion_rates;
  }
}
