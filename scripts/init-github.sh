#!/bin/bash
# ============================================================
# init-github.sh — Tạo GitHub repo và push lần đầu
# Yêu cầu: gh CLI đã auth (gh auth login)
# Usage: bash scripts/init-github.sh
# ============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
header() { echo -e "\n${BLUE}▶ $1${NC}"; }

header "Khởi tạo GitHub Repository"

# Kiểm tra gh CLI
if ! command -v gh &>/dev/null; then
  echo "❌ GitHub CLI chưa cài. Chạy: brew install gh"
  exit 1
fi

# Kiểm tra auth
if ! gh auth status &>/dev/null; then
  warn "Chưa đăng nhập GitHub. Đang mở trình đăng nhập..."
  gh auth login
fi

# Input
read -p "Tên repo (mặc định: ecommerce-platform): " REPO_NAME
REPO_NAME="${REPO_NAME:-ecommerce-platform}"

read -p "Mô tả repo: " REPO_DESC
REPO_DESC="${REPO_DESC:-E-Commerce Platform — Full-stack TMĐT}"

read -p "Private repo? (y/N): " IS_PRIVATE
IS_PRIVATE="${IS_PRIVATE:-N}"

# Tạo repo
header "Tạo repository: $REPO_NAME"
if [[ "$IS_PRIVATE" =~ ^[Yy]$ ]]; then
  gh repo create "$REPO_NAME" --private --description "$REPO_DESC"
else
  gh repo create "$REPO_NAME" --public --description "$REPO_DESC"
fi
log "Repository tạo thành công"

# Lấy remote URL
REMOTE_URL=$(gh repo view "$REPO_NAME" --json sshUrl -q .sshUrl)
log "Remote URL: $REMOTE_URL"

# Init git nếu chưa có
if [ ! -d ".git" ]; then
  git init
  log "Git initialized"
fi

# Setup remote
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
log "Remote 'origin' set"

# Setup branches
header "Tạo branch structure"
git checkout -b main 2>/dev/null || git checkout main

# Initial commit
git add .
git commit -m "chore: initial project setup

- Docker Compose local environment
- GitHub Actions CI/CD pipeline  
- Project structure và documentation
- Environment template"

git push -u origin main
log "main branch pushed"

# Tạo develop branch
git checkout -b develop
git push -u origin develop
log "develop branch pushed"

# Protect branches
header "Bảo vệ branches"
gh api repos/:owner/"$REPO_NAME"/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Pipeline / lint","CI Pipeline / test-unit","CI Pipeline / build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  2>/dev/null && log "main branch protected" || warn "Không thể protect branch (cần repo permissions)"

# Tạo GitHub Environments
header "Tạo Environments"
gh api repos/:owner/"$REPO_NAME"/environments/staging --method PUT 2>/dev/null && log "staging environment created" || warn "Cần tạo environments thủ công"
gh api repos/:owner/"$REPO_NAME"/environments/production --method PUT \
  --field wait_timer=0 \
  --field reviewers='[]' \
  2>/dev/null && log "production environment created" || warn "Cần tạo environments thủ công"

# Setup GitHub Labels
header "Tạo Issue Labels"
labels=(
  "type:feature,0075ca,Tính năng mới"
  "type:fix,d73a4a,Sửa lỗi"
  "type:docs,0075ca,Tài liệu"
  "type:refactor,e4e669,Refactor"
  "type:test,0e8a16,Testing"
  "priority:critical,b60205,Ưu tiên cao nhất"
  "priority:high,d93f0b,Ưu tiên cao"
  "priority:medium,fbca04,Ưu tiên trung bình"
  "priority:low,0075ca,Ưu tiên thấp"
  "service:auth,5319e7,Auth Service"
  "service:product,1d76db,Product Service"
  "service:order,0075ca,Order Service"
  "service:payment,e4e669,Payment Service"
)
for label_data in "${labels[@]}"; do
  IFS=',' read -r name color description <<< "$label_data"
  gh label create "$name" --color "$color" --description "$description" --force 2>/dev/null
done
log "Labels created"

header "✅ Repository setup hoàn tất!"
echo ""
echo "  Repository: https://github.com/$(gh api user -q .login)/$REPO_NAME"
echo ""
echo "Bước tiếp theo:"
echo "  1. Vào GitHub → Settings → Secrets and variables → Actions"
echo "  2. Thêm secrets:"
echo "     - RAILWAY_TOKEN_STAGING  (lấy từ Railway dashboard)"
echo "     - RAILWAY_TOKEN_PRODUCTION"
echo "     - SLACK_WEBHOOK_URL (tùy chọn)"
echo "     - CODECOV_TOKEN (tùy chọn)"
echo ""
echo "  3. Setup Railway: https://railway.app"
echo "     bash scripts/setup-railway.sh"
