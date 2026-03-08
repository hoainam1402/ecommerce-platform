import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const databaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host:     config.get<string>('DB_HOST', 'localhost'),
  port:     config.get<number>('DB_PORT', 5432),
  username: config.get<string>('DB_USER', 'ecom_user'),
  password: config.get<string>('DB_PASSWORD', 'ecom_pass_local'),
  database: config.get<string>('DB_NAME', 'ecom_db'),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: true,   // bật tạm để tạo bảng tự động khi dev
  logging: true,
  ssl: false,
});