#!/bin/bash

# =============================================================================
# WA Gateway - Production Mode Script
# =============================================================================
# Script untuk menjalankan backend dan frontend dalam mode production dengan PM2
# Sistem akan berjalan di background dan tetap aktif setelah terminal ditutup
# =============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Production Mode${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}🚀 Starting WA Gateway in Production Mode with PM2...${NC}"
echo ""

# Check if PM2 is installed
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi

# Start backend
echo -e "${BLUE}[1/2] Starting Backend...${NC}"
cd backend

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: Backend package.json not found${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install --production
fi

# Start backend with PM2
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start server.js --name wa-gateway-be --env production
fi

cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo -e "${BLUE}[2/2] Starting Frontend...${NC}"
cd frontend

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: Frontend package.json not found${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install --production
fi

# Build frontend for production
if [ ! -d ".output" ]; then
    echo -e "${YELLOW}Building frontend for production...${NC}"
    npm run build
fi

# Start frontend with PM2
pm2 start npm --name wa-gateway-fe -- run preview

cd ..

# Save PM2 process list
pm2 save

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Application Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Services are running in background with PM2:${NC}"
echo -e "  Backend: ${GREEN}wa-gateway-be${NC}"
echo -e "  Frontend: ${GREEN}wa-gateway-fe${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  Status: ${YELLOW}pm2 status${NC}"
echo -e "  Monitor: ${YELLOW}pm2 monit${NC}"
echo -e "  Logs: ${YELLOW}pm2 logs${NC}"
echo -e "  Stop: ${YELLOW}./stop.sh${NC} or ${YELLOW}pm2 stop all${NC}"
echo ""
echo -e "${GREEN}✓ Application will continue running in background${NC}"
echo -e "${GREEN}✓ Safe to close terminal${NC}"
echo ""
