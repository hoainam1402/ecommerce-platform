#!/bin/bash
# Chạy từ ~/Documents/ecom-setup/

cd apps

# 1. Tạo Next.js app
pnpm create next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack

cd frontend

# 2. Cài thêm dependencies
pnpm add \
  @tanstack/react-query \
  axios \
  zustand \
  react-hook-form \
  @hookform/resolvers \
  zod \
  next-auth \
  lucide-react \
  clsx \
  tailwind-merge \
  class-variance-authority \
  embla-carousel-react \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-toast \
  @radix-ui/react-slider \
  @radix-ui/react-checkbox \
  @radix-ui/react-avatar \
  @radix-ui/react-tabs \
  @radix-ui/react-accordion \
  date-fns \
  numeral

pnpm add -D \
  @types/numeral

echo "✅ Frontend setup done!"
