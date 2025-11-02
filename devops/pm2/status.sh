#!/bin/bash

# =============================================================================
# WA Gateway - Status Script
# =============================================================================
# Script untuk mengecek status backend dan frontend WA Gateway
# =============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Application Status${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check Backend
echo -e "${BLUE}Backend Status:${NC}"

# Check PM2
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "wa-gateway-be"; then
    PM2_STATUS=$(pm2 jlist | grep -o '"name":"wa-gateway-be"[^}]*"pm2_env":{"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "  Status: ${GREEN}Running with PM2 (wa-gateway-be)${NC}"
        pm2 info wa-gateway-be | grep -E "(status|uptime|memory|cpu)" | head -5
    else
        echo -e "  Status: ${RED}Stopped (PM2)${NC}"
    fi
else
    # Check using PID file
    if [ -f ".backend.pid" ]; then
        BACKEND_PID=$(cat .backend.pid)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "  Status: ${GREEN}Running${NC} (PID: $BACKEND_PID)"
        else
            echo -e "  Status: ${RED}Stopped${NC}"
        fi
    else
        # Check if process exists
        if pgrep -f "node.*server.js" > /dev/null 2>&1 || pgrep -f "nodemon.*server.js" > /dev/null 2>&1; then
            echo -e "  Status: ${GREEN}Running${NC} (process found)"
        else
            echo -e "  Status: ${RED}Stopped${NC}"
        fi
    fi
fi

# Check if backend is responding
echo -e "  Health Check:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "    API: ${GREEN}✓ Responding${NC}"
    BACKEND_HEALTH=$(curl -s http://localhost:3001/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    echo -e "    Status: ${GREEN}$BACKEND_HEALTH${NC}"
else
    echo -e "    API: ${RED}✗ Not responding${NC}"
fi

echo ""

# Check Frontend
echo -e "${BLUE}Frontend Status:${NC}"

# Check PM2
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "wa-gateway-fe"; then
    PM2_STATUS=$(pm2 jlist | grep -o '"name":"wa-gateway-fe"[^}]*"pm2_env":{"status":"[^"]*"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "  Status: ${GREEN}Running with PM2 (wa-gateway-fe)${NC}"
        pm2 info wa-gateway-fe | grep -E "(status|uptime|memory|cpu)" | head -5
    else
        echo -e "  Status: ${RED}Stopped (PM2)${NC}"
    fi
else
    # Check using PID file
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "  Status: ${GREEN}Running${NC} (PID: $FRONTEND_PID)"
        else
            echo -e "  Status: ${RED}Stopped${NC}"
        fi
    else
        # Check if process exists
        if pgrep -f "nuxt.*dev" > /dev/null 2>&1 || pgrep -f "nuxt.*preview" > /dev/null 2>&1; then
            echo -e "  Status: ${GREEN}Running${NC} (process found)"
        else
            echo -e "  Status: ${RED}Stopped${NC}"
        fi
    fi
fi

# Check if frontend is responding
echo -e "  Health Check:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "    Web: ${GREEN}✓ Responding${NC}"
else
    echo -e "    Web: ${RED}✗ Not responding${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
