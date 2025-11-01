#!/bin/bash

# =============================================================================
# WA Gateway - Stop Script
# =============================================================================
# Script untuk menghentikan backend dan frontend WA Gateway
# =============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Stopping Application${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop Backend
echo -e "${BLUE}[1/2] Stopping Backend...${NC}"

# Check if using PM2
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "klikwhatsapp-backend"; then
    echo -e "${YELLOW}Stopping backend with PM2...${NC}"
    pm2 stop klikwhatsapp-backend
    echo -e "${GREEN}✓ Backend stopped (PM2)${NC}"
else
    # Stop using PID file
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping backend process (PID: $BACKEND_PID)...${NC}"
            kill $BACKEND_PID 2>/dev/null || true
            echo -e "${GREEN}✓ Backend stopped${NC}"
        else
            echo -e "${YELLOW}Backend process not found${NC}"
        fi
        rm -f .backend.pid
    else
        # Try to find and kill node processes
        echo -e "${YELLOW}Looking for backend processes...${NC}"
        pkill -f "node.*server.js" 2>/dev/null || true
        pkill -f "nodemon.*server.js" 2>/dev/null || true
        echo -e "${GREEN}✓ Backend processes terminated${NC}"
    fi
fi

# Stop Frontend
echo -e "${BLUE}[2/2] Stopping Frontend...${NC}"

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping frontend process (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend process not found${NC}"
    fi
    rm -f .frontend.pid
else
    # Try to find and kill node processes
    echo -e "${YELLOW}Looking for frontend processes...${NC}"
    pkill -f "nuxt.*dev" 2>/dev/null || true
    pkill -f "nuxt.*preview" 2>/dev/null || true
    echo -e "${GREEN}✓ Frontend processes terminated${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Application Stopped Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
