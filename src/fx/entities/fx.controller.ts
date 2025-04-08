import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FxService } from './fx.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('fx')
@UseGuards(JwtAuthGuard)
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get('rate')
  getRate(@Query('base') base: string, @Query('target') target: string) {
    return this.fxService.getRate(base, target);
  }

  @Get('rates')
  getAllRates(@Query('base') base?: string) {
    return this.fxService.getAllRates(base);
  }
}
