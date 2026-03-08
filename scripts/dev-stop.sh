#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE="docker compose -f $ROOT_DIR/docker/docker-compose.yml"

GREEN='\033[0;32m'; NC='\033[0m'
echo -e "${GREEN}▶ Dừng tất cả services...${NC}"
$COMPOSE --profile tools down
echo -e "${GREEN}[✓]${NC} Đã dừng. Data vẫn được giữ trong volumes."
echo ""
echo "  Xóa toàn bộ data:  bash scripts/dev-reset.sh"
echo "  Xem volumes:       docker volume ls | grep ecom"