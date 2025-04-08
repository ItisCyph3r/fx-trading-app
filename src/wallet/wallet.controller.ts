import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
  } from '@nestjs/common';
  import { WalletService } from './wallet.service';
  import { FundWalletDto } from './dto/fund-wallet.dto';
  import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
  import { ConvertCurrencyDto } from './dto/convert-currency.dto';
  
  @Controller('wallet')
  @UseGuards(JwtAuthGuard)
  export class WalletController {
    constructor(private readonly walletService: WalletService) {}
  
    @Get()
    getWallets(@Req() req) {
      return this.walletService.getUserWallets(req.user.userId);
    }
  
    @Post('fund')
    fundWallet(@Req() req, @Body() dto: FundWalletDto) {
      return this.walletService.fundWallet(req.user.userId, dto);
    }

    

@Post('convert')
convert(@Req() req, @Body() dto: ConvertCurrencyDto) {
  return this.walletService.convertCurrency(req.user.userId, dto);
}

  }
  