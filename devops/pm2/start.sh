#!/bin/bash

# =============================================================================
# WA Gateway - Start Script
# =============================================================================
# Script untuk menjalankan backend dan frontend WA Gateway
# =============================================================================

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
MODE=${1:-dev}  # dev or production (default: dev)
# Note: All modes run in background with PM2

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Starting Application${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Mode: ${GREEN}$MODE${NC}"
echo -e "Running in: ${GREEN}Background (PM2)${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists node; then
    echo -e "${YELLOW}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${YELLOW}Error: npm is not installed${NC}"
    exit 1
fi

# Start Backend
echo -e "${BLUE}[1/2] Starting Backend...${NC}"
cd "$PROJECT_ROOT"
cd "$BACKEND_DIR"

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: Backend package.json not found${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start with PM2 (always use PM2 for background execution)
if ! command_exists pm2; then
    echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}Starting backend with PM2 (wa-gateway-be)...${NC}"
# Stop and delete existing process if any
if pm2 list | grep -q "wa-gateway-be"; then
    echo -e "${YELLOW}Stopping existing wa-gateway-be process...${NC}"
    pm2 delete wa-gateway-be 2>/dev/null || pm2 stop wa-gateway-be 2>/dev/null || true
    sleep 2
fi
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env $MODE
else
    pm2 start server.js --name wa-gateway-be --env $MODE
fi
pm2 save

cd "$PROJECT_ROOT"

# Wait for backend to start
echo -e "${BLUE}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if pm2 list | grep -q "wa-gateway-be.*online"; then
    echo -e "${GREEN}✓ Backend is running with PM2 (wa-gateway-be)${NC}"
else
    echo -e "${YELLOW}⚠ Backend might not be running properly${NC}"
fi

# Start Frontend
echo -e "${BLUE}[2/2] Starting Frontend...${NC}"
cd "$PROJECT_ROOT"
cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: Frontend package.json not found${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start with PM2 (always use PM2 for background execution)
echo -e "${GREEN}Starting frontend with PM2 (wa-gateway-fe)...${NC}"
# Stop and delete existing process if any
if pm2 list | grep -q "wa-gateway-fe"; then
    echo -e "${YELLOW}Stopping existing wa-gateway-fe process...${NC}"
    pm2 delete wa-gateway-fe 2>/dev/null || pm2 stop wa-gateway-fe 2>/dev/null || true
    sleep 2
fi
if [ "$MODE" = "production" ]; then
    # Build for production if not already built
    if [ ! -d ".output" ]; then
        echo -e "${YELLOW}Building frontend for production...${NC}"
        npm run build
    fi
    pm2 start npm --name wa-gateway-fe -- run preview
else
    pm2 start npm --name wa-gateway-fe -- run dev
fi
pm2 save

cd "$PROJECT_ROOT"

# Wait for frontend to start
echo -e "${BLUE}Waiting for frontend to start...${NC}"
sleep 5

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Application Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}"
echo -e "  Status: ${GREEN}Running with PM2 (wa-gateway-be)${NC}"
echo -e "  URL: ${YELLOW}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC}"
echo -e "  Status: ${GREEN}Running with PM2 (wa-gateway-fe)${NC}"
echo -e "  URL: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  Status: ${YELLOW}./status.sh${NC} or ${YELLOW}pm2 status${NC}"
echo -e "  Monitor: ${YELLOW}pm2 monit${NC}"
echo -e "  Logs: ${YELLOW}pm2 logs${NC} or ${YELLOW}pm2 logs wa-gateway-be${NC}"
echo -e "  Stop: ${YELLOW}./stop.sh${NC}"
echo -e "  Restart: ${YELLOW}./restart.sh${NC}"
echo ""
echo -e "${GREEN}✓ Services are running in background${NC}"
echo -e "${GREEN}✓ Safe to close terminal - services will continue running${NC}"
echo ""

# Exit immediately - services run in background
exit 0
