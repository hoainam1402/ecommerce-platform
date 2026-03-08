import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || 'DISABLED',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || 'DISABLED',
      callbackURL: `${config.get('APP_URL', 'http://localhost:3000')}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    done(null, {
      providerUid: id,
      email: emails?.[0]?.value,
      fullName: `${name.givenName} ${name.familyName}`.trim(),
      avatarUrl: photos?.[0]?.value,
      accessToken,
    });
  }
}
