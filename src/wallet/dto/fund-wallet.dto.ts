import { IsString, IsPositive } from 'class-validator';

export class FundWalletDto {
  @IsString()
  currency: string; // only NGN allowed for funding

  @IsPositive()
  amount: number;
}
