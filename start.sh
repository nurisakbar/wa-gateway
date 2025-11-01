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
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"
MODE=${1:-dev}  # dev or production (default: dev)
USE_PM2=${2:-false}  # true untuk menggunakan PM2 (default: false)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Starting Application${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Mode: ${GREEN}$MODE${NC}"
echo -e "PM2: ${GREEN}$USE_PM2${NC}"
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

if [ "$USE_PM2" = "true" ]; then
    # Start with PM2
    if ! command_exists pm2; then
        echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
        npm install -g pm2
    fi
    
    echo -e "${GREEN}Starting backend with PM2...${NC}"
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env $MODE
    else
        pm2 start server.js --name klikwhatsapp-backend --env $MODE
    fi
    pm2 save
else
    # Start with npm
    if [ "$MODE" = "production" ]; then
        echo -e "${GREEN}Starting backend in production mode...${NC}"
        npm start &
    else
        echo -e "${GREEN}Starting backend in development mode...${NC}"
        npm run dev &
    fi
    BACKEND_PID=$!
    echo $BACKEND_PID > ../.backend.pid
fi

cd ..

# Wait for backend to start
echo -e "${BLUE}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if [ "$USE_PM2" = "true" ]; then
    if pm2 list | grep -q "klikwhatsapp-backend.*online"; then
        echo -e "${GREEN}✓ Backend is running with PM2${NC}"
    else
        echo -e "${YELLOW}⚠ Backend might not be running properly${NC}"
    fi
else
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
    else
        echo -e "${YELLOW}⚠ Backend might not be running properly${NC}"
    fi
fi

# Start Frontend
echo -e "${BLUE}[2/2] Starting Frontend...${NC}"
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

echo -e "${GREEN}Starting frontend...${NC}"
if [ "$MODE" = "production" ]; then
    npm run build
    npm run preview &
else
    npm run dev &
fi
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid

cd ..

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
if [ "$USE_PM2" = "true" ]; then
    echo -e "  Status: ${GREEN}Running with PM2${NC}"
    echo -e "  Monitor: ${YELLOW}pm2 monit${NC}"
    echo -e "  Logs: ${YELLOW}pm2 logs klikwhatsapp-backend${NC}"
else
    echo -e "  Status: ${GREEN}Running${NC} (PID: $BACKEND_PID)"
    echo -e "  URL: ${YELLOW}http://localhost:3001${NC}"
fi
echo ""
echo -e "${BLUE}Frontend:${NC}"
echo -e "  Status: ${GREEN}Running${NC} (PID: $FRONTEND_PID)"
echo -e "  URL: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Management:${NC}"
echo -e "  Stop: ${YELLOW}./stop.sh${NC}"
echo -e "  Restart: ${YELLOW}./restart.sh${NC}"
echo -e "  Logs: ${YELLOW}tail -f backend/logs/*.log${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Keep script running
wait
