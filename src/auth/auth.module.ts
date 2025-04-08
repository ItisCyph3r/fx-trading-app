import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '..//user/user.entity';
import { AuthOtp } from './entities/auth-otp.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WalletModule } from '..//wallet/wallet.module'; 
import { Wallet } from '..//wallet/wallet.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthOtp, Wallet]),
    PassportModule,
    WalletModule, // Add this to import the WalletModule
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}