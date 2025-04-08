import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('verify')
  verify(@Body() data: VerifyOtpDto) {
    return this.authService.verifyOtp(data);
  }

  @Post('resend-otp')
    resendOtp(@Body() data: ResendOtpDto) {
        return this.authService.resendOtp(data);
    }

  
}
