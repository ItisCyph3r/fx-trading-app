import { IsString, IsPositive } from 'class-validator';

export class ConvertCurrencyDto {
  @IsString()
  fromCurrency: string;

  @IsString()
  toCurrency: string;

  @IsPositive()
  amount: number;
}
