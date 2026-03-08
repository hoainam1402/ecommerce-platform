import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';
import { UserAuthProvider, AuthProvider } from './entities/user-auth-provider.entity';
import { UserSession } from './entities/user-session.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserAuthProvider)
    private readonly authProviderRepo: Repository<UserAuthProvider>,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
  ) {}

  // ─── Tìm user ──────────────────────────────────────────────
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User không tồn tại');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  // ─── Tạo user mới ──────────────────────────────────────────
  async createWithEmail(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }): Promise<User> {
    // Check duplicate
    if (await this.findByEmail(data.email)) {
      throw new ConflictException('Email đã được sử dụng');
    }
    if (data.phone && await this.findByPhone(data.phone)) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = this.userRepo.create({
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
    });
    await this.userRepo.save(user);

    // Lưu auth provider (email + hashed password)
    const authProvider = this.authProviderRepo.create({
      userId: user.id,
      provider: AuthProvider.EMAIL,
      providerUid: hashedPassword,
    });
    await this.authProviderRepo.save(authProvider);

    return user;
  }

  async createWithOAuth(data: {
    provider: AuthProvider;
    providerUid: string;
    email?: string;
    fullName: string;
    avatarUrl?: string;
    accessToken?: string;
  }): Promise<User> {
    // Check nếu đã có user với OAuth này
    const existing = await this.authProviderRepo.findOne({
      where: { provider: data.provider, providerUid: data.providerUid },
      relations: ['user'],
    });
    if (existing) return existing.user;

    // Tạo user mới
    const user = this.userRepo.create({
      email: data.email,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
      emailVerified: !!data.email,
    });
    await this.userRepo.save(user);

    const authProvider = this.authProviderRepo.create({
      userId: user.id,
      provider: data.provider,
      providerUid: data.providerUid,
      accessToken: data.accessToken,
    });
    await this.authProviderRepo.save(authProvider);

    return user;
  }

  // ─── Verify password ───────────────────────────────────────
  async validatePassword(user: User, password: string): Promise<boolean> {
    const authProvider = await this.authProviderRepo.findOne({
      where: { userId: user.id, provider: AuthProvider.EMAIL },
    });
    if (!authProvider) return false;
    return bcrypt.compare(password, authProvider.providerUid);
  }

  // ─── Sessions ──────────────────────────────────────────────
  async createSession(data: {
    userId: string;
    refreshToken: string;
    deviceInfo?: Record<string, any>;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<UserSession> {
    const session = this.sessionRepo.create(data);
    return this.sessionRepo.save(session);
  }

  async findSession(refreshToken: string): Promise<UserSession | null> {
    return this.sessionRepo.findOne({
      where: { refreshToken },
      relations: ['user'],
    });
  }

  async revokeSession(refreshToken: string): Promise<void> {
    await this.sessionRepo.update(
      { refreshToken },
      { revokedAt: new Date() },
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where('userId = :userId AND revokedAt IS NULL', { userId })
      .execute();
  }

  // ─── Update ────────────────────────────────────────────────
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { lastLoginAt: new Date() });
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    await this.userRepo.update(userId, data);
    return this.findById(userId);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepo.update(userId, { emailVerified: true });
  }

  async markPhoneVerified(userId: string): Promise<void> {
    await this.userRepo.update(userId, { phoneVerified: true });
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.authProviderRepo.update(
      { userId, provider: AuthProvider.EMAIL },
      { providerUid: hashed },
    );
  }

  async checkStatus(user: User): Promise<void> {
    if (user.status === UserStatus.BANNED) {
      throw new ConflictException('Tài khoản đã bị khóa');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new ConflictException('Tài khoản chưa kích hoạt');
    }
  }
}
