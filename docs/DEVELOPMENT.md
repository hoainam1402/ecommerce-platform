# Development Guide

## Yêu cầu trước khi bắt đầu

| Tool | Version | Kiểm tra |
|------|---------|----------|
| macOS | 13+ | `sw_vers` |
| Git | 2.x | `git --version` |
| Node.js | 20 LTS | `node --version` |
| pnpm | 9.x | `pnpm --version` |
| Docker Desktop | 4.x | `docker --version` |

---

## Lần đầu setup (chỉ làm 1 lần)

```bash
# 1. Clone repo
git clone https://github.com/YOUR_ORG/ecommerce-platform.git
cd ecommerce-platform

# 2. Cài toàn bộ tools trên macOS
bash scripts/setup-mac.sh

# 3. Cài Node dependencies
pnpm install

# 4. Setup git hooks
pnpm prepare

# 5. Copy env và điền thông tin
cp .env.example .env
# Mở .env và điền các giá trị (xem hướng dẫn bên dưới)
```

---

## Khởi động hàng ngày

```bash
# Khởi động tất cả services
bash scripts/dev-start.sh

# Khởi động với GUI tools (pgAdmin, Redis Commander)
bash scripts/dev-start.sh --with-tools

# Chạy backend
pnpm dev:backend

# Chạy frontend (terminal khác)
pnpm dev:frontend

# Dừng khi xong
bash scripts/dev-stop.sh
```

---

## Services & Ports

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| Backend API | 3000 | http://localhost:3000 | NestJS |
| Swagger UI | 3000 | http://localhost:3000/docs | API docs |
| Frontend | 3001 | http://localhost:3001 | Next.js |
| PostgreSQL | 5432 | localhost:5432 | DB chính |
| Redis | 6379 | localhost:6379 | Cache |
| Elasticsearch | 9200 | http://localhost:9200 | Search |
| MinIO S3 | 9000 | http://localhost:9000 | File storage |
| MinIO Console | 9001 | http://localhost:9001 | MinIO UI |
| MailHog | 8025 | http://localhost:8025 | Email testing |
| pgAdmin | 5050 | http://localhost:5050 | DB GUI (--with-tools) |
| Redis UI | 8081 | http://localhost:8081 | Redis GUI (--with-tools) |

---

## Cấu hình .env quan trọng

Các biến **bắt buộc** phải điền để app chạy được:

```env
# Generate secure secrets:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<generate>
JWT_REFRESH_SECRET=<generate>
```

Các biến **có thể để mặc định** khi dev local:
- `DB_*` — đã có default phù hợp với Docker Compose
- `REDIS_*` — đã có default
- `MAIL_*` — MailHog tự xử lý, không cần điền
- `STORAGE_*` — MinIO local, đã có default

---

## Database

```bash
# Chạy migrations
pnpm --filter backend migration:run

# Tạo migration mới
pnpm --filter backend migration:generate -- src/migrations/TenMigration

# Revert migration cuối
pnpm --filter backend migration:revert

# Seed data mẫu
pnpm --filter backend seed
```

---

## Git Workflow

```
main          ← production (protected, require PR + approval)
  └── develop ← staging (protected, require PR)
        └── feature/ten-tinh-nang
        └── fix/ten-loi
        └── hotfix/ten-loi-khan
```

### Tạo feature mới:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/product-search
# ... code ...
git add .
git commit -m "feat(product): add elasticsearch full-text search"
git push origin feature/product-search
# Tạo PR vào develop trên GitHub
```

### Commit message convention:
```
feat(scope): mô tả ngắn
fix(scope): mô tả ngắn
docs(scope): mô tả ngắn
refactor(scope): mô tả ngắn
test(scope): mô tả ngắn
chore(scope): mô tả ngắn

Scope: auth | user | product | order | payment | cart | admin | infra
```

---

## Testing

```bash
# Unit tests
pnpm test

# Unit tests với coverage
pnpm test:cov

# Integration tests (cần Docker running)
pnpm test:e2e

# Watch mode
pnpm test --watch
```

**Coverage targets:** Backend ≥ 80%, Frontend ≥ 60%

---

## Railway (Staging/Production)

### Deploy staging:
```bash
# Tự động khi merge vào main
git push origin main
# → GitHub Actions chạy CI → nếu pass → deploy Railway staging
```

### Deploy production:
```bash
# Tạo tag version
git tag v1.0.0
git push origin v1.0.0
# → GitHub Actions tạo release + deploy production (cần manual approval)
```

### Xem logs Railway:
```bash
railway logs --service backend --environment staging
```

---

## Troubleshooting

### Docker không khởi động được Elasticsearch
```bash
# macOS: tăng virtual memory
sudo sysctl -w vm.max_map_count=262144
```

### Port bị chiếm
```bash
# Xem process đang dùng port
lsof -i :5432
kill -9 <PID>
```

### Reset hoàn toàn local
```bash
bash scripts/dev-reset.sh
```

### Xem logs từng service
```bash
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f elasticsearch
```
