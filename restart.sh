#!/bin/bash

# =============================================================================
# WA Gateway - Restart Script
# =============================================================================
# Script untuk restart backend dan frontend WA Gateway
# Mendukung reload PM2 (zero downtime) untuk production mode
# =============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODE=${1:-production}  # dev or production (default: production untuk PM2)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Restarting Application${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PM2 is available
if command -v pm2 >/dev/null 2>&1; then
    # Check if apps are running with PM2
    BACKEND_RUNNING=$(pm2 jlist 2>/dev/null | grep -q '"name":"wa-gateway-be"' && echo "yes" || echo "no")
    FRONTEND_RUNNING=$(pm2 jlist 2>/dev/null | grep -q '"name":"wa-gateway-fe"' && echo "yes" || echo "no")
    
    if [ "$BACKEND_RUNNING" = "yes" ] || [ "$FRONTEND_RUNNING" = "yes" ]; then
        echo -e "${BLUE}Restarting with PM2 (zero downtime reload)...${NC}"
        echo ""
        
        # Reload backend (zero downtime)
        if [ "$BACKEND_RUNNING" = "yes" ]; then
            echo -e "${YELLOW}[1/2] Reloading backend (wa-gateway-be)...${NC}"
            pm2 reload wa-gateway-be 2>/dev/null || pm2 restart wa-gateway-be 2>/dev/null || true
            echo -e "${GREEN}✓ Backend reloaded${NC}"
        else
            echo -e "${YELLOW}[1/2] Starting backend (wa-gateway-be)...${NC}"
            cd backend
            if [ -f "ecosystem.config.js" ]; then
                pm2 start ecosystem.config.js --env $MODE
            else
                pm2 start server.js --name wa-gateway-be --env $MODE
            fi
            cd ..
            echo -e "${GREEN}✓ Backend started${NC}"
        fi
        
        # Wait a moment
        sleep 2
        
        # Reload frontend (zero downtime)
        if [ "$FRONTEND_RUNNING" = "yes" ]; then
            echo -e "${YELLOW}[2/2] Reloading frontend (wa-gateway-fe)...${NC}"
            pm2 reload wa-gateway-fe 2>/dev/null || pm2 restart wa-gateway-fe 2>/dev/null || true
            echo -e "${GREEN}✓ Frontend reloaded${NC}"
        else
            echo -e "${YELLOW}[2/2] Starting frontend (wa-gateway-fe)...${NC}"
            cd frontend
            # Build if needed
            if [ "$MODE" = "production" ] && [ ! -d ".output" ]; then
                echo -e "${YELLOW}Building frontend...${NC}"
                npm run build
            fi
            pm2 start npm --name wa-gateway-fe -- run preview
            cd ..
            echo -e "${GREEN}✓ Frontend started${NC}"
        fi
        
        # Save PM2 process list
        pm2 save
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  Application Restarted Successfully!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${BLUE}Status:${NC}"
        pm2 status
        echo ""
        echo -e "${BLUE}Services are running in background with PM2${NC}"
        echo -e "${GREEN}✓ Safe to close terminal${NC}"
        echo ""
        exit 0
    fi
fi

# Fallback to stop and start method
echo -e "${BLUE}Using stop and start method...${NC}"
echo ""

# Stop application
echo -e "${BLUE}Stopping application...${NC}"
./stop.sh

# Wait a moment
sleep 2

# Start application
echo -e "${BLUE}Starting application...${NC}"
if [ "$MODE" = "production" ]; then
    ./prod.sh
else
    ./start.sh $MODE false
fi
