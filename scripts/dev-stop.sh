#!/bin/bash
# dev-stop.sh — Dừng local environment
GREEN='\033[0;32m'; NC='\033[0m'
echo -e "${GREEN}▶ Dừng tất cả services...${NC}"
docker compose --profile tools down
echo -e "${GREEN}[✓]${NC} Đã dừng. Data vẫn được giữ trong volumes."
echo ""
echo "  Xóa toàn bộ data:  bash scripts/dev-reset.sh"
echo "  Xem volumes:       docker volume ls | grep ecom"
