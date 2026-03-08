import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';

export enum AuthProvider { EMAIL = 'email', GOOGLE = 'google', FACEBOOK = 'facebook', PHONE = 'phone' }

@Entity('user_auth_providers')
@Unique(['provider', 'providerUid'])
export class UserAuthProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: AuthProvider })
  provider: AuthProvider;

  @Column({ name: 'provider_uid', length: 255 })
  providerUid: string;   // hashed password hoặc OAuth UID

  @Column({ name: 'access_token', type: 'text', nullable: true })
  @Exclude()
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
