#!/bin/bash
# dev-reset.sh — Xóa sạch data local (dùng khi cần fresh start)
RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
echo -e "${RED}⚠️  CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ data local!${NC}"
echo "   Bao gồm: PostgreSQL, Redis, Elasticsearch, MinIO"
echo ""
read -p "Bạn chắc chắn? (gõ 'yes' để xác nhận): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Đã hủy."
  exit 0
fi
echo -e "${YELLOW}▶ Dừng và xóa containers + volumes...${NC}"
docker compose --profile tools down -v --remove-orphans
echo "✅ Reset xong. Chạy 'bash scripts/dev-start.sh' để bắt đầu lại."
