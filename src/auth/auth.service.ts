import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';

import { User } from '../user/user.entity';
import { AuthOtp } from './entities/auth-otp.entity';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
  
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(AuthOtp) private otpRepo: Repository<AuthOtp>,
        private config: ConfigService,
        private jwtService: JwtService,
    ) {}

    async register(data: RegisterDto) {
        const existing = await this.userRepo.findOneBy({ email: data.email });
        if (existing) throw new BadRequestException('Email already in use');

        const hashed = await bcrypt.hash(data.password, 10);
        const user = this.userRepo.create({ ...data, password: hashed });
        await this.userRepo.save(user);

        await this.sendOtpEmail(data.email);
        return { message: 'User created. OTP sent to email.' };
    }

    async sendOtpEmail(email: string) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        await this.otpRepo.save(this.otpRepo.create({ email, otp }));

        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: this.config.get('EMAIL_USER'),
            pass: this.config.get('EMAIL_PASS'),
        },
        });

        await transporter.sendMail({
        from: `"FX Trading App" <${this.config.get('EMAIL_USER')}>`,
        to: email,
        subject: 'Verify your email',
        text: `Your OTP is: ${otp}`,
        });
    }

    async verifyOtp(data: VerifyOtpDto) {
        const otpRecord = await this.otpRepo.findOne({
        where: { email: data.email, otp: data.otp },
        order: { createdAt: 'DESC' },
        });

        if (!otpRecord) throw new BadRequestException('Invalid OTP');

        const user = await this.userRepo.findOneBy({ email: data.email });
        user.isVerified = true;
        
        // Add this after user.isVerified = true and before return
        await this.walletRepo.save(
            this.walletRepo.create({
            user,
            currency: 'NGN',
            balance: 1000,
            }),
        );


        await this.userRepo.save(user);
        return { message: 'Email verified successfully.' };
    }

    async login(data: LoginDto) {
        const user = await this.userRepo.findOneBy({ email: data.email });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(data.password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        if (!user.isVerified)
        throw new UnauthorizedException('Please verify your email');

        const payload = { sub: user.id, role: user.role };
        return {
        access_token: this.jwtService.sign(payload),
        };
    }
}
  