#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Zipybills Barcode Scanner${NC}"
echo ""

# Change to project root
cd "$(dirname "$0")"

# Start scanning service
echo -e "${BLUE}📦 Starting Scanning Service (port 3003)...${NC}"
pnpm --filter @zipybills/barcode-scanning-service-runtime dev > /tmp/scanning-service.log 2>&1 &
SCAN_PID=$!

sleep 2

# Start machines service
echo -e "${BLUE}🏭 Starting Machines Service (port 3006)...${NC}"
pnpm --filter @zipybills/barcode-machines-service-runtime dev > /tmp/machines-service.log 2>&1 &
MACHINES_PID=$!

sleep 2

# Start web app
echo -e "${BLUE}🌐 Starting Universal App (web on port 8081)...${NC}"
pnpm --filter @zipybills/barcode-scanner-mobile web

# This will keep running until Ctrl+C
# When Ctrl+C is pressed, kill all background processes
trap "echo ''; echo -e '${YELLOW}Stopping all services...${NC}'; kill $SCAN_PID $MACHINES_PID 2>/dev/null; exit" INT TERM
