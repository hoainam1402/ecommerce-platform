import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Register ────────────────────────────────────────────────
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2, { message: 'Tên tối thiểu 2 ký tự' })
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @Matches(/^(0|\+84)[3-9]\d{8}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;
}

// ─── Login ───────────────────────────────────────────────────
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

// ─── Google OAuth ────────────────────────────────────────────
export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID Token từ frontend' })
  @IsString()
  idToken: string;
}

// ─── Refresh Token ───────────────────────────────────────────
export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

// ─── OTP ─────────────────────────────────────────────────────
export class SendOtpDto {
  @ApiProperty({ example: '0901234567' })
  @Matches(/^(0|\+84)[3-9]\d{8}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '0901234567' })
  @Matches(/^(0|\+84)[3-9]\d{8}$/)
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}

// ─── Password Reset ──────────────────────────────────────────
export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  newPassword: string;
}
