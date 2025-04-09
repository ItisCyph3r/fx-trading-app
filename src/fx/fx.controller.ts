import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { FxService } from './fx.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('fx')
@UseGuards(JwtAuthGuard)
export class FxController {
  constructor(
    private readonly fxService: FxService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get('rate')
  getRate(@Query('base') base: string, @Query('target') target: string) {
    return this.fxService.getRate(base, target);
  }

  @Get('rates')
  getAllRates(@Query('base') base?: string) {
    return this.fxService.getAllRates(base);
  }

  @Get('test-cache')
  async testCache() {
    const key = 'test-key';
    await this.cacheManager.set(key, 'test-value', 30);
    const value = await this.cacheManager.get(key);
    return {
      cached: value,
      timestamp: new Date(),
    };
  }
}
