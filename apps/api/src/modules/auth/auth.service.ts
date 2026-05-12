import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthTokens, LoginDto, RegisterDto, SessionUser } from '@osint/types';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') || 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
    });

    return { message: 'Registration successful' };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        throw new UnauthorizedException('2FA required');
      }
      // Phase 2: verify TOTP here, skipping for now as per "scaffold" requirements
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user, ip, userAgent);
  }

  async refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const refreshTokenHash = await this.hashToken(refreshToken);
    
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old session (rotation)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(session.user, ip, userAgent);
  }

  async logout(refreshToken: string): Promise<void> {
    const refreshTokenHash = await this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async generateTokens(user: any, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessTtl = this.configService.get<number>('JWT_ACCESS_TTL') || 900;
    const refreshTtl = this.configService.get<number>('JWT_REFRESH_TTL') || 2592000;
    
    const accessToken = this.jwtService.sign(payload);
    
    const plainRefreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = await this.hashToken(plainRefreshToken);

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshTtl);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ip,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: plainRefreshToken,
      accessTtl,
      refreshTtl,
    };
  }

  private async hashToken(token: string): Promise<string> {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  async validateUser(payload: any): Promise<SessionUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    
    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}
