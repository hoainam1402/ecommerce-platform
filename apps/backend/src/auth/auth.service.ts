import {
  Injectable, UnauthorizedException, BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AuthProvider } from '../users/entities/user-auth-provider.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { randomBytes } from 'crypto';
import * as dayjs from 'dayjs';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly ACCESS_EXPIRES  = 15 * 60;        // 15 phút (giây)
  private readonly REFRESH_EXPIRES = 30 * 24 * 3600; // 30 ngày (giây)
  private readonly OTP_TTL         = 5 * 60;          // 5 phút
  private readonly OTP_PREFIX      = 'otp:';
  private readonly RESET_PREFIX    = 'pwd_reset:';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // ─── Register ──────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.usersService.createWithEmail({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      phone: dto.phone,
    });
    const tokens = await this.generateTokens(user);
    return { tokens, user };
  }

  // ─── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto, meta?: { ip?: string; deviceInfo?: any }): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    await this.usersService.checkStatus(user);

    const valid = await this.usersService.validatePassword(user, dto.password);
    if (!valid) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user, meta);
    return { tokens, user };
  }

  // ─── Google OAuth ──────────────────────────────────────────
  async loginWithGoogle(googleUser: {
    providerUid: string;
    email?: string;
    fullName: string;
    avatarUrl?: string;
    accessToken?: string;
  }): Promise<{ tokens: AuthTokens; user: User }> {
    const user = await this.usersService.createWithOAuth({
      provider: AuthProvider.GOOGLE,
      ...googleUser,
    });
    await this.usersService.checkStatus(user);
    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user);
    return { tokens, user };
  }

  // ─── Refresh Token ─────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const session = await this.usersService.findSession(refreshToken);

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    // Rotate: revoke cũ, cấp mới
    await this.usersService.revokeSession(refreshToken);
    const tokens = await this.generateTokens(session.user);
    return tokens;
  }

  // ─── Logout ────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    await this.usersService.revokeSession(refreshToken);
  }

  // ─── OTP (Phone) ───────────────────────────────────────────
  async sendOtp(phone: string): Promise<void> {
    // Rate limit: 1 OTP mỗi 60 giây
    const rateLimitKey = `otp_rl:${phone}`;
    const recent = await this.cache.get(rateLimitKey);
    if (recent) throw new BadRequestException('Vui lòng đợi 60 giây trước khi gửi lại');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.cache.set(`${this.OTP_PREFIX}${phone}`, otp, this.OTP_TTL * 1000);
    await this.cache.set(rateLimitKey, '1', 60_000);

    // TODO: gọi SMS service (ESMS hoặc Twilio)
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  async verifyOtp(phone: string, otp: string): Promise<{ tokens: AuthTokens; user: User }> {
    const stored = await this.cache.get<string>(`${this.OTP_PREFIX}${phone}`);
    if (!stored || stored !== otp) {
      throw new UnauthorizedException('OTP không đúng hoặc đã hết hạn');
    }
    await this.cache.del(`${this.OTP_PREFIX}${phone}`);

    // Tìm hoặc tạo user bằng phone
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      user = await this.usersService.createWithOAuth({
        provider: AuthProvider.PHONE,
        providerUid: phone,
        fullName: phone,
      });
    }
    await this.usersService.markPhoneVerified(user.id);
    await this.usersService.checkStatus(user);
    const tokens = await this.generateTokens(user);
    return { tokens, user };
  }

  // ─── Password Reset ────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Luôn trả về 200 dù email có tồn tại hay không (tránh user enumeration)
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await this.cache.set(`${this.RESET_PREFIX}${token}`, user.id, 30 * 60 * 1000); // 30 phút

    // TODO: gửi email với link reset
    console.log(`[DEV] Reset token for ${email}: ${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.cache.get<string>(`${this.RESET_PREFIX}${token}`);
    if (!userId) throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');

    await this.usersService.changePassword(userId, newPassword);
    await this.cache.del(`${this.RESET_PREFIX}${token}`);
    await this.usersService.revokeAllUserSessions(userId);
  }

  // ─── Internal: tạo JWT tokens ──────────────────────────────
  private async generateTokens(
    user: User,
    meta?: { ip?: string; deviceInfo?: any },
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.ACCESS_EXPIRES,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.REFRESH_EXPIRES,
      }),
    ]);

    // Lưu session
    await this.usersService.createSession({
      userId: user.id,
      refreshToken,
      ipAddress: meta?.ip,
      deviceInfo: meta?.deviceInfo,
      expiresAt: dayjs().add(30, 'day').toDate(),
    });

    return { accessToken, refreshToken, expiresIn: this.ACCESS_EXPIRES };
  }
}
