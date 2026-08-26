#!/bin/bash

# ============================================================
#  RescueLink AI — Run Script (Ubuntu)
#  Uses MongoDB Atlas (cloud) — no local MongoDB needed
#  Usage: ./run.sh
#  Stop:  Ctrl+C
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Stopping RescueLink AI...${NC}"
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null
  echo -e "${GREEN}✅ All services stopped. Goodbye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

clear
echo -e "${RED}"
echo "   ██████╗ ███████╗███████╗ ██████╗██╗   ██╗███████╗"
echo "   ██╔══██╗██╔════╝██╔════╝██╔════╝██║   ██║██╔════╝"
echo "   ██████╔╝█████╗  ███████╗██║     ██║   ██║█████╗  "
echo "   ██╔══██╗██╔══╝  ╚════██║██║     ██║   ██║██╔══╝  "
echo "   ██║  ██║███████╗███████║╚██████╗╚██████╔╝███████╗"
echo "   ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚══════╝"
echo -e "${NC}"
echo -e "${RED}   🚨 RescueLink AI — Emergency Response Platform 🚨${NC}"
echo -e "      Every second counts. Be the help."
echo ""

# ── Install dependencies if missing ────────────────────────
if [ ! -d "server/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing server dependencies (first time)...${NC}"
  cd server && npm install && cd ..
  echo -e "${GREEN}✅ Server dependencies installed${NC}"
fi

if [ ! -d "client/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing client dependencies (first time)...${NC}"
  cd client && npm install && cd ..
  echo -e "${GREEN}✅ Client dependencies installed${NC}"
fi

# ── MongoDB Atlas (no local setup needed) ─────────────────
echo -e "${BLUE}[1/3]${NC} Database..."
echo -e "      ${GREEN}✅ Using MongoDB Atlas (cloud) — no local setup needed${NC}"

# ── Start Backend ──────────────────────────────────────────
echo -e "${BLUE}[2/3]${NC} Starting Backend on port 5000..."

# Kill anything already on port 5000
fuser -k 5000/tcp 2>/dev/null || true
sleep 0.5

cd server
node src/index.js > /tmp/rescuelink-backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo -n "      Connecting to Atlas & starting"
for i in {1..15}; do
  sleep 1
  echo -n "."
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo ""
    echo -e "      ${RED}❌ Backend crashed! Error:${NC}"
    cat /tmp/rescuelink-backend.log
    exit 1
  fi
  if curl -s http://localhost:5000/api/auth/me > /dev/null 2>&1; then
    break
  fi
done
echo ""

# Confirm MongoDB Atlas connected
if grep -q "MongoDB Connected" /tmp/rescuelink-backend.log 2>/dev/null; then
  echo -e "      ${GREEN}✅ MongoDB Atlas connected${NC}"
fi
echo -e "      ${GREEN}✅ Backend running  →  http://localhost:5000${NC}"

# ── Start Frontend ─────────────────────────────────────────
echo -e "${BLUE}[3/3]${NC} Starting Frontend on port 5173..."

fuser -k 5173/tcp 2>/dev/null || true
sleep 0.5

cd client
npm run dev > /tmp/rescuelink-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -n "      Starting Vite"
for i in {1..15}; do
  sleep 1
  echo -n "."
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo ""
    echo -e "      ${RED}❌ Frontend crashed! Error:${NC}"
    cat /tmp/rescuelink-frontend.log
    cleanup
    exit 1
  fi
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    break
  fi
done
echo ""
echo -e "      ${GREEN}✅ Frontend running →  http://localhost:5173${NC}"

# ── READY ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🚨 RescueLink AI is LIVE!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐 Open in browser :  ${CYAN}http://localhost:5173${NC}"
echo -e "  🔌 Backend API     :  ${CYAN}http://localhost:5000${NC}"
echo -e "  🗄️  Database        :  ${GREEN}MongoDB Atlas ✅${NC}"
echo -e "  🤖 Groq AI         :  ${GREEN}Configured ✅${NC}"
echo ""
echo -e "${YELLOW}  Steps to Register:${NC}"
echo -e "  1. Open ${CYAN}http://localhost:5173/register${NC}"
echo -e "  2. Enter Name → Phone → Password → Role"
echo -e "  3. Click ${GREEN}Create Account${NC}"
echo ""
echo -e "  ${RED}Press Ctrl+C to stop all services${NC}"
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
