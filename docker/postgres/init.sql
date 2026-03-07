-- Tạo thêm database cho testing
CREATE DATABASE ecom_test;
GRANT ALL PRIVILEGES ON DATABASE ecom_test TO ecom_user;

-- Enable extensions trên cả 2 DB
\c ecom_db
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

\c ecom_test
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
