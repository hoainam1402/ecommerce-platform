#!/bin/bash
# ============================================================
# E-Commerce Platform — macOS Setup Script
# Chạy lần đầu để cài toàn bộ dependencies
# Usage: bash setup-mac.sh
# ============================================================

set -e  # Dừng nếu có lỗi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
error()  { echo -e "${RED}[✗]${NC} $1"; }
header() { echo -e "\n${BLUE}═══ $1 ═══${NC}\n"; }

header "E-Commerce Platform — macOS Setup"
echo "Script này sẽ cài đặt toàn bộ tools cần thiết."
echo "Thời gian ước tính: 5-10 phút"
echo ""

# ─── 1. Homebrew ─────────────────────────────────────────────
header "1. Homebrew"
if ! command -v brew &>/dev/null; then
  warn "Homebrew chưa có, đang cài..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  log "Homebrew installed"
else
  log "Homebrew đã có: $(brew --version | head -1)"
fi

# ─── 2. Node.js (via nvm) ────────────────────────────────────
header "2. Node.js 20 LTS"
if ! command -v nvm &>/dev/null; then
  warn "Cài nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm use 20
nvm alias default 20
log "Node.js: $(node --version)"
log "npm: $(npm --version)"

# ─── 3. pnpm ─────────────────────────────────────────────────
header "3. pnpm (package manager)"
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi
log "pnpm: $(pnpm --version)"

# ─── 4. Docker Desktop ───────────────────────────────────────
header "4. Docker Desktop"
if ! command -v docker &>/dev/null; then
  warn "Docker chưa có. Đang cài qua Homebrew Cask..."
  brew install --cask docker
  warn "⚠️  Hãy mở Docker Desktop thủ công và đợi nó khởi động xong, rồi chạy lại script này."
  warn "   Hoặc tải tại: https://www.docker.com/products/docker-desktop/"
else
  log "Docker: $(docker --version)"
  log "Docker Compose: $(docker compose version)"
fi

# ─── 5. Git config ───────────────────────────────────────────
header "5. Git configuration"
if [ -z "$(git config --global user.name)" ]; then
  warn "Git chưa được cấu hình. Nhập thông tin của bạn:"
  read -p "  Tên của bạn: " git_name
  read -p "  Email GitHub: " git_email
  git config --global user.name "$git_name"
  git config --global user.email "$git_email"
fi
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global core.autocrlf input
log "Git user: $(git config --global user.name) <$(git config --global user.email)>"

# ─── 6. GitHub CLI ───────────────────────────────────────────
header "6. GitHub CLI"
if ! command -v gh &>/dev/null; then
  brew install gh
fi
log "GitHub CLI: $(gh --version | head -1)"
warn "Chạy 'gh auth login' để đăng nhập GitHub (nếu chưa làm)"

# ─── 7. Global npm tools ─────────────────────────────────────
header "7. Global tools"
npm install -g @nestjs/cli typescript ts-node
log "NestJS CLI: $(nest --version 2>/dev/null || echo 'installed')"
log "TypeScript: $(tsc --version)"

# ─── 8. VS Code extensions ───────────────────────────────────
header "8. VS Code Extensions"
if command -v code &>/dev/null; then
  extensions=(
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
    "eamodio.gitlens"
    "ms-azuretools.vscode-docker"
    "Prisma.prisma"
    "bradlc.vscode-tailwindcss"
    "rangav.vscode-thunder-client"
    "mikestead.dotenv"
    "streetsidesoftware.code-spell-checker"
    "usernamehw.errorlens"
  )
  for ext in "${extensions[@]}"; do
    code --install-extension "$ext" --force &>/dev/null
    log "Installed: $ext"
  done
else
  warn "VS Code không tìm thấy. Tải tại: https://code.visualstudio.com/"
  warn "Sau khi cài, chạy lại script để install extensions."
fi

# ─── Done ────────────────────────────────────────────────────
header "Setup hoàn tất! 🎉"
echo ""
echo "Bước tiếp theo:"
echo "  1. cd ecommerce-platform"
echo "  2. bash scripts/dev-start.sh   → Khởi động local environment"
echo "  3. Mở VS Code: code ."
echo ""
echo "Docs: ./docs/DEVELOPMENT.md"
