import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// ─── Mocks ───────────────────────────────────────────────────
const mockUser = {
  id: 'uuid-1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'customer',
  status: 'active',
};

const mockUsersService = {
  createWithEmail: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  validatePassword: jest.fn(),
  updateLastLogin: jest.fn(),
  createSession: jest.fn(),
  findSession: jest.fn(),
  revokeSession: jest.fn(),
  revokeAllUserSessions: jest.fn(),
  checkStatus: jest.fn(),
  changePassword: jest.fn(),
  markPhoneVerified: jest.fn(),
  createWithOAuth: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

// ─── Tests ───────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService,   useValue: mockUsersService },
        { provide: JwtService,     useValue: mockJwtService },
        { provide: ConfigService,  useValue: { getOrThrow: jest.fn().mockReturnValue('secret') } },
        { provide: CACHE_MANAGER,  useValue: mockCache },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('nên tạo user và trả về tokens', async () => {
      mockUsersService.createWithEmail.mockResolvedValue(mockUser);
      mockUsersService.createSession.mockResolvedValue({});

      const result = await service.register({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens.accessToken).toBeDefined();
      expect(mockUsersService.createWithEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('nên đăng nhập thành công', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.checkStatus.mockResolvedValue(undefined);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockUsersService.createSession.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toBeDefined();
    });

    it('nên throw UnauthorizedException nếu email không tồn tại', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('nên throw UnauthorizedException nếu password sai', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.checkStatus.mockResolvedValue(undefined);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('nên cấp token mới nếu refresh token hợp lệ', async () => {
      const futureDate = new Date(Date.now() + 86400_000);
      mockUsersService.findSession.mockResolvedValue({
        user: mockUser,
        revokedAt: null,
        expiresAt: futureDate,
      });
      mockUsersService.revokeSession.mockResolvedValue(undefined);
      mockUsersService.createSession.mockResolvedValue({});

      const tokens = await service.refreshTokens('valid-refresh-token');
      expect(tokens.accessToken).toBeDefined();
    });

    it('nên throw nếu session đã revoke', async () => {
      mockUsersService.findSession.mockResolvedValue({
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400_000),
      });

      await expect(service.refreshTokens('revoked-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('sendOtp', () => {
    it('nên gửi OTP thành công', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);

      await service.sendOtp('0901234567');
      expect(mockCache.set).toHaveBeenCalledTimes(2); // OTP + rate limit
    });

    it('nên throw nếu gửi quá nhanh', async () => {
      mockCache.get.mockResolvedValue('1'); // rate limit key exists

      await expect(service.sendOtp('0901234567'))
        .rejects.toThrow('Vui lòng đợi 60 giây');
    });
  });
});
