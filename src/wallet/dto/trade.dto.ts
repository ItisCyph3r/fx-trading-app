import { IsString, IsPositive, IsEnum } from 'class-validator';

export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export class TradeCurrencyDto {
  @IsString()
  baseCurrency: string;  // The currency you're trading (e.g., NGN)

  @IsString()
  quoteCurrency: string; // The currency you're trading against (e.g., USD)

  @IsPositive()
  amount: number;        // Amount in base currency

  @IsEnum(TradeSide)
  side: TradeSide;      // BUY or SELL
}