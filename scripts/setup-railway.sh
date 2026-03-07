#!/bin/bash
# ============================================================
# setup-railway.sh — Hướng dẫn setup Railway.app
# Budget: Free tier → ~$5/tháng cho staging
# ============================================================

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
header() { echo -e "\n${BLUE}═══ $1 ═══${NC}\n"; }
step()   { echo -e "${GREEN}[$1]${NC} $2"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }

header "Railway Setup Guide — E-Commerce Platform"

echo "Railway là platform deploy đơn giản, chi phí thấp."
echo "Free tier: 500 giờ/tháng (đủ cho staging)"
echo "Pro plan: \$5/tháng (không giới hạn giờ)"
echo ""

header "Bước 1: Tạo tài khoản Railway"
step "1.1" "Truy cập https://railway.app"
step "1.2" "Sign up bằng GitHub account"
step "1.3" "Xác nhận email"
echo ""

header "Bước 2: Cài Railway CLI"
if ! command -v railway &>/dev/null; then
  echo "Đang cài Railway CLI..."
  brew install railway
  echo ""
fi
echo "Railway CLI version: $(railway --version 2>/dev/null || echo 'installed')"
echo ""
step "2.1" "Đăng nhập CLI:"
echo "       railway login"
echo ""

header "Bước 3: Tạo Project trên Railway"
echo ""
echo "Option A — Qua dashboard (khuyến nghị lần đầu):"
step "3.1" "Vào https://railway.app/new"
step "3.2" "Chọn 'Empty Project'"
step "3.3" "Đặt tên: ecommerce-platform"
echo ""
echo "Option B — Qua CLI:"
echo "       railway init"
echo ""

header "Bước 4: Thêm services vào Railway"
echo ""
warn "Làm theo thứ tự này trong Railway dashboard:"
echo ""
step "4.1" "PostgreSQL:"
echo "       + New Service → Database → PostgreSQL"
echo "       Tên: postgres-staging"
echo ""
step "4.2" "Redis:"
echo "       + New Service → Database → Redis"
echo "       Tên: redis-staging"
echo ""
step "4.3" "Backend (NestJS):"
echo "       + New Service → GitHub Repo → chọn repo của bạn"
echo "       Root Directory: apps/backend"
echo "       Tên: backend-staging"
echo ""

header "Bước 5: Lấy Railway Token cho GitHub Actions"
step "5.1" "Vào Railway → Account Settings → Tokens"
step "5.2" "Tạo token mới, đặt tên: github-actions-staging"
step "5.3" "Copy token"
step "5.4" "Vào GitHub repo → Settings → Secrets → New secret"
echo "       Name: RAILWAY_TOKEN_STAGING"
echo "       Value: <token vừa copy>"
echo ""

header "Bước 6: Set Environment Variables trên Railway"
echo ""
echo "Trong Railway dashboard → Backend service → Variables:"
echo ""
cat << 'ENVLIST'
  NODE_ENV=staging
  PORT=3000
  DATABASE_URL=${{postgres-staging.DATABASE_URL}}    ← Railway tự inject
  REDIS_URL=${{redis-staging.REDIS_URL}}             ← Railway tự inject
  JWT_ACCESS_SECRET=<generate random 64 bytes hex>
  JWT_REFRESH_SECRET=<generate random 64 bytes hex>
  FRONTEND_URL=https://your-frontend.vercel.app
ENVLIST
echo ""
warn "Để generate secrets: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo ""

header "Bước 7: Kiểm tra deployment"
step "7.1" "Push code lên main branch"
step "7.2" "Xem GitHub Actions: github.com/YOUR_ORG/REPO/actions"
step "7.3" "Xem Railway logs: railway logs --service backend-staging"
step "7.4" "Test API: curl https://YOUR_RAILWAY_URL.railway.app/health"
echo ""

header "Chi phí ước tính"
echo ""
echo "  Staging (Railway Free/Hobby):"
echo "  ├── PostgreSQL:     \$0 (500MB free)"
echo "  ├── Redis:          \$0 (25MB free)"
echo "  ├── Backend:        \$0-5/tháng (free 500h)"
echo "  └── TỔNG:          ~\$0-5/tháng ✓"
echo ""
echo "  Production (khi go-live):"
echo "  ├── Railway Pro:   \$20/tháng"
echo "  ├── PostgreSQL:    \$5/tháng (1GB)"
echo "  ├── Redis:         \$5/tháng"
echo "  ├── Cloudflare:    \$0 (free tier)"
echo "  └── TỔNG:         ~\$30/tháng"
echo ""
warn "Vẫn trong budget <\$50/tháng cho giai đoạn đầu!"
echo ""

header "Docs hữu ích"
echo "  Railway docs:     https://docs.railway.app"
echo "  Railway Discord:  https://discord.gg/railway"
echo "  Vercel (Frontend): https://vercel.com (free)"
