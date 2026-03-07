#!/bin/bash
# ============================================================
# dev-start.sh — Khởi động toàn bộ local environment
# Usage: bash scripts/dev-start.sh [--with-tools]
# ============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
header() { echo -e "\n${BLUE}▶ $1${NC}"; }

WITH_TOOLS=false
[[ "$1" == "--with-tools" ]] && WITH_TOOLS=true

header "Kiểm tra dependencies"

# Check Docker
if ! docker info &>/dev/null; then
  echo "❌ Docker không chạy. Hãy mở Docker Desktop trước."
  exit 1
fi
log "Docker đang chạy"

# Check .env
if [ ! -f ".env" ]; then
  warn ".env không tìm thấy. Đang copy từ .env.example..."
  cp .env.example .env
  warn "⚠️  Hãy điền các giá trị cần thiết trong .env rồi chạy lại!"
  exit 1
fi
log ".env tìm thấy"

header "Khởi động services"

# Start core services
if $WITH_TOOLS; then
  docker compose --profile tools up -d
  log "Khởi động core + tools (pgAdmin, Redis Commander)"
else
  docker compose up -d postgres redis elasticsearch minio mailhog
  log "Khởi động core services"
fi

header "Đợi services sẵn sàng"

# Wait for PostgreSQL
echo -n "  Đợi PostgreSQL"
until docker compose exec -T postgres pg_isready -q 2>/dev/null; do
  echo -n "."
  sleep 1
done
echo ""
log "PostgreSQL sẵn sàng"

# Wait for Redis
echo -n "  Đợi Redis"
until docker compose exec -T redis redis-cli -a "${REDIS_PASSWORD:-redis_pass_local}" ping 2>/dev/null | grep -q PONG; do
  echo -n "."
  sleep 1
done
echo ""
log "Redis sẵn sàng"

# Run DB migrations if apps exist
if [ -d "apps/backend" ] && [ -f "apps/backend/package.json" ]; then
  header "Chạy database migrations"
  cd apps/backend
  pnpm migration:run 2>/dev/null && log "Migrations xong" || warn "Migrations chưa có hoặc đã chạy"
  cd ../..
fi

header "Tất cả sẵn sàng! 🚀"
echo ""
echo "  ┌────────────────────────────────────────────┐"
echo "  │  Service URLs                              │"
echo "  │                                            │"
echo "  │  Backend API    → http://localhost:3000    │"
echo "  │  Frontend       → http://localhost:3001    │"
echo "  │  Swagger UI     → http://localhost:3000/docs│"
echo "  │  PostgreSQL     → localhost:5432           │"
echo "  │  Redis          → localhost:6379           │"
echo "  │  Elasticsearch  → http://localhost:9200    │"
echo "  │  MinIO S3       → http://localhost:9000    │"
echo "  │  MinIO Console  → http://localhost:9001    │"
echo "  │  MailHog UI     → http://localhost:8025    │"
if $WITH_TOOLS; then
echo "  │  pgAdmin        → http://localhost:5050    │"
echo "  │  Redis UI       → http://localhost:8081    │"
fi
echo "  └────────────────────────────────────────────┘"
echo ""
echo "  Để dừng: bash scripts/dev-stop.sh"
echo "  Logs:    docker compose logs -f [service]"
