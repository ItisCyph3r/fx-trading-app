import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class JwtBlacklistGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      return true; // No user ID, let JwtAuthGuard handle it
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.cacheManager.get(`bl_${userId}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }
}