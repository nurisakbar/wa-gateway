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
if command -v pm2 >/dev/null 2>&1; then
    # Check for backend app (wa-gateway-be) - handle all instances
    if pm2 jlist 2>/dev/null | grep -q '"name":"wa-gateway-be"'; then
        echo -e "${YELLOW}Stopping backend with PM2 (wa-gateway-be)...${NC}"
        # Delete all instances with this name (handles duplicates)
        pm2 delete wa-gateway-be 2>/dev/null || true
        # Also delete by ID if still exists (handle orphaned processes)
        pm2 jlist 2>/dev/null | grep -o '"name":"wa-gateway-be".*"pm_id":[0-9]*' | grep -o '"pm_id":[0-9]*' | cut -d'"' -f4 | while read id; do
            pm2 delete $id 2>/dev/null || true
        done
        pm2 save 2>/dev/null || true
        echo -e "${GREEN}✓ Backend stopped and removed (PM2)${NC}"
    else
        # Check for other backend app names as fallback
        BACKEND_APPS=$(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*"' | grep -E "(wa-gateway-be|wa-gateway.*backend|klikwhatsapp-backend)" | cut -d'"' -f4)
        if [ -n "$BACKEND_APPS" ]; then
            echo -e "${YELLOW}Stopping backend with PM2...${NC}"
            for app in $BACKEND_APPS; do
                echo -e "  Stopping: ${YELLOW}$app${NC}"
                pm2 stop "$app" 2>/dev/null || true
                pm2 delete "$app" 2>/dev/null || true
            done
            pm2 save 2>/dev/null || true
            echo -e "${GREEN}✓ Backend stopped (PM2)${NC}"
        else
            echo -e "${YELLOW}No PM2 backend processes found, checking other methods...${NC}"
        fi
    fi
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
        pkill -f "wa-gateway.*backend" 2>/dev/null || true
        pkill -f "klikwhatsapp.*backend" 2>/dev/null || true
        
        # Force kill jika masih ada proses
        sleep 2
        if pgrep -f "server.js" > /dev/null 2>&1; then
            echo -e "${YELLOW}Force killing backend processes...${NC}"
            pkill -9 -f "node.*server.js" 2>/dev/null || true
            pkill -9 -f "nodemon.*server.js" 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✓ Backend processes terminated${NC}"
    fi
fi

# Stop Frontend
echo -e "${BLUE}[2/2] Stopping Frontend...${NC}"

# Check if using PM2
if command -v pm2 >/dev/null 2>&1; then
    # Check for frontend app (wa-gateway-fe) - handle all instances
    if pm2 jlist 2>/dev/null | grep -q '"name":"wa-gateway-fe"'; then
        echo -e "${YELLOW}Stopping frontend with PM2 (wa-gateway-fe)...${NC}"
        # Delete all instances with this name (handles duplicates)
        pm2 delete wa-gateway-fe 2>/dev/null || true
        # Also delete by ID if still exists (handle orphaned processes)
        pm2 jlist 2>/dev/null | grep -o '"name":"wa-gateway-fe".*"pm_id":[0-9]*' | grep -o '"pm_id":[0-9]*' | cut -d'"' -f4 | while read id; do
            pm2 delete $id 2>/dev/null || true
        done
        pm2 save 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend stopped and removed (PM2)${NC}"
    else
        # Check for other frontend app names as fallback
        FRONTEND_APPS=$(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*"' | grep -E "(wa-gateway-fe|wa-gateway.*frontend)" | cut -d'"' -f4)
        if [ -n "$FRONTEND_APPS" ]; then
            echo -e "${YELLOW}Stopping frontend with PM2...${NC}"
            for app in $FRONTEND_APPS; do
                echo -e "  Stopping: ${YELLOW}$app${NC}"
                pm2 stop "$app" 2>/dev/null || true
                pm2 delete "$app" 2>/dev/null || true
            done
            pm2 save 2>/dev/null || true
            echo -e "${GREEN}✓ Frontend stopped (PM2)${NC}"
        else
            # Try PID file or process kill
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
        fi
    fi
else
    # Stop using PID file
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
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Application Stopped Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Note:${NC}"
echo -e "  To stop and remove from PM2 permanently: ${YELLOW}./stop.sh --delete${NC}"
echo -e "  To restart: ${YELLOW}./restart.sh production${NC} or ${YELLOW}./prod.sh${NC}"
echo ""
