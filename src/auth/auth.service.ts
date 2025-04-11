import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { User } from '../user/user.entity';
import { AuthOtp } from './entities/auth-otp.entity';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { Wallet } from '../wallet/wallet.entity'; 
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(AuthOtp) private otpRepo: Repository<AuthOtp>,
        @InjectRepository(Wallet) private walletRepo: Repository<Wallet>, 
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
        
        try {
            // Save OTP first
            await this.otpRepo.save(this.otpRepo.create({ email, otp }));

            const transporter = nodemailer.createTransport({
                service: 'gmail',  // Use Gmail service
                auth: {
                    user: this.config.get('EMAIL_USER'),
                    pass: this.config.get('EMAIL_PASS') // Use Gmail App Password
                }
            });

            // Verify transporter connection
            await transporter.verify();

            await transporter.sendMail({
                from: `"FX Trading App" <${this.config.get('EMAIL_USER')}>`,
                to: email,
                subject: 'Verify your email',
                text: `Your OTP is: ${otp}`,
                html: `
                    <h1>Email Verification</h1>
                    <p>Your OTP is: <strong>${otp}</strong></p>
                    <p>This OTP will expire in 10 minutes.</p>
                `
            });

            return otp;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error(`Email service error: ${error.message}`);

            return otp;
        }
    }
    async verifyOtp(data: VerifyOtpDto) {
        try {
            const otpRecord = await this.otpRepo.findOne({
                where: { email: data.email, otp: data.otp },
                order: { createdAt: 'DESC' },
            });

            if (!otpRecord) throw new BadRequestException('Invalid OTP');

            const user = await this.userRepo.findOneBy({ email: data.email });
            if (!user) throw new BadRequestException('User not found');

            // Check if user is already verified
            if (user.isVerified) {
                throw new BadRequestException('Email already verified');
            }

            user.isVerified = true;
            await this.userRepo.save(user);

            // Check if user already has an NGN wallet
            const existingWallet = await this.walletRepo.findOne({
                where: { 
                    user: { id: user.id },
                    currency: 'NGN'
                }
            });

            // Only create wallet if one doesn't exist
            if (!existingWallet) {
                await this.walletRepo.save(
                    this.walletRepo.create({
                        user,
                        currency: 'NGN',
                        balance: 1000,
                    })
                );
            }

            return { message: 'Email verified successfully.' };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Verification failed');
        }
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

    async resendOtp(data: ResendOtpDto) {
        const user = await this.userRepo.findOneBy({ email: data.email });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('Email already verified');
        }

        await this.sendOtpEmail(data.email);
        return { message: 'New OTP sent to email' };
    }
    // async logout(userId: string) {
    //     try {
    //         // Add token to blacklist in Redis
    //         const key = `bl_${userId}`;
    //         // Fix: Use set() directly instead of store.set
    //         await this.cacheManager.set(key, 'true', 3600);
            
    //         return {
    //             message: 'Logged out successfully'
    //         };
    //     } catch (error) {
    //         console.error('Logout error:', error);
    //         throw new BadRequestException('Logout failed');
    //     }
    // }

    async logout(userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }
    
        try {
            // Add token to blacklist in Redis
            const key = `bl_${userId}`;
            await this.cacheManager.set(key, 'true', 3600); // 1 hour expiry
            
            return {
                message: 'Logged out successfully'
            };
        } catch (error) {
            console.error('Logout error:', error);
            throw new BadRequestException('Logout failed: ' + error.message);
        }
    }
}
