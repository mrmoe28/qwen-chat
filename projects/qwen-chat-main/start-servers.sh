#!/bin/bash

###########################################
# Qwen Chat Server Manager
# Auto-restart on failure, GPU priority
###########################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Qwen Chat Servers...${NC}"

# Project directory
PROJECT_DIR="/Users/ekodevapps/projects/qwen-chat-main"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Log directory
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

# PID files
OLLAMA_PID_FILE="$LOG_DIR/ollama.pid"
BACKEND_PID_FILE="$LOG_DIR/backend.pid"
FRONTEND_PID_FILE="$LOG_DIR/frontend.pid"

# Function to check if process is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to start Ollama with auto-restart
start_ollama() {
    echo -e "${YELLOW}📦 Starting Ollama server...${NC}"

    # Check if already running
    if pgrep -f "ollama serve" > /dev/null; then
        echo -e "${GREEN}✓ Ollama already running${NC}"
        return 0
    fi

    # Start Ollama in background with auto-restart
    while true; do
        ollama serve >> "$LOG_DIR/ollama.log" 2>&1 &
        OLLAMA_PID=$!
        echo $OLLAMA_PID > "$OLLAMA_PID_FILE"
        echo -e "${GREEN}✓ Ollama started (PID: $OLLAMA_PID)${NC}"

        # Wait for process to exit
        wait $OLLAMA_PID
        EXIT_CODE=$?

        echo -e "${RED}⚠ Ollama crashed (exit code: $EXIT_CODE). Restarting in 5 seconds...${NC}"
        sleep 5
    done &

    # Wait for Ollama to be ready
    echo -e "${YELLOW}⏳ Waiting for Ollama to be ready...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags > /dev/null; then
            echo -e "${GREEN}✓ Ollama is ready${NC}"
            
            # Preload model for faster first response
            echo -e "${YELLOW}🔄 Preloading model for faster responses...${NC}"
            preload_model &
            
            return 0
        fi
        sleep 1
    done

    echo -e "${RED}✗ Ollama failed to start${NC}"
    return 1
}

# Function to preload model in background
preload_model() {
    # Wait a bit for Ollama to fully initialize
    sleep 2
    
    # Default model to preload
    MODEL_TO_PRELOAD="${OLLAMA_PRELOAD_MODEL:-qwen2.5-coder:7b}"
    
    echo -e "${YELLOW}📥 Preloading model: $MODEL_TO_PRELOAD${NC}"
    
    # Preload by making a simple request (this loads model into memory)
    curl -s -X POST http://localhost:11434/api/generate \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$MODEL_TO_PRELOAD\",
            \"prompt\": \"test\",
            \"stream\": false,
            \"options\": {
                \"num_predict\": 1,
                \"keep_alive\": \"5m\"
            }
        }" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Model preloaded successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Model preload failed (will load on first request)${NC}"
    fi
}

# Function to start backend with auto-restart
start_backend() {
    echo -e "${YELLOW}🐍 Starting Python backend...${NC}"

    cd "$BACKEND_DIR"

    # Use Anaconda Python if available (has FastAPI), otherwise venv, then system Python
    if [ -f "/opt/anaconda3/bin/python" ]; then
        PYTHON_CMD="/opt/anaconda3/bin/python"
    elif [ -f "venv/bin/python" ]; then
        PYTHON_CMD="venv/bin/python"
    elif [ -f "venv/bin/python3" ]; then
        PYTHON_CMD="venv/bin/python3"
    else
        PYTHON_CMD="python3"
    fi

    # Auto-restart loop
    while true; do
        $PYTHON_CMD main.py >> "$LOG_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_PID_FILE"
        echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

        # Wait for process to exit
        wait $BACKEND_PID
        EXIT_CODE=$?

        echo -e "${RED}⚠ Backend crashed (exit code: $EXIT_CODE). Restarting in 5 seconds...${NC}"
        sleep 5
    done &
}

# Function to start frontend with auto-restart
start_frontend() {
    echo -e "${YELLOW}⚛️  Starting Next.js frontend...${NC}"

    cd "$FRONTEND_DIR"

    # Auto-restart loop
    while true; do
        TURBOPACK=0 npm run dev >> "$LOG_DIR/frontend.log" 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
        echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

        # Wait for process to exit
        wait $FRONTEND_PID
        EXIT_CODE=$?

        echo -e "${RED}⚠ Frontend crashed (exit code: $EXIT_CODE). Restarting in 5 seconds...${NC}"
        sleep 5
    done &
}

# Function to stop all servers
stop_servers() {
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"

    # Kill PIDs from files
    for pid_file in "$OLLAMA_PID_FILE" "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                kill $pid 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done

    # Kill by process name as backup
    pkill -f "ollama serve" || true
    pkill -f "python3 main.py" || true
    pkill -f "next dev" || true

    echo -e "${GREEN}✓ All servers stopped${NC}"
}

# Handle Ctrl+C
trap stop_servers EXIT INT TERM

# Main execution
case "${1:-start}" in
    start)
        start_ollama
        sleep 2
        start_backend
        sleep 2
        start_frontend

        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✅ All servers running!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "Frontend:    ${YELLOW}http://localhost:3000${NC}"
        echo -e "Backend API: ${YELLOW}http://localhost:8000${NC}"
        echo -e "Ollama API:  ${YELLOW}http://localhost:11434${NC}"
        echo ""
        echo -e "Logs:"
        echo -e "  Ollama:   ${YELLOW}$LOG_DIR/ollama.log${NC}"
        echo -e "  Backend:  ${YELLOW}$LOG_DIR/backend.log${NC}"
        echo -e "  Frontend: ${YELLOW}$LOG_DIR/frontend.log${NC}"
        echo ""
        echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all servers"
        echo ""

        # Keep script running
        while true; do
            sleep 60
        done
        ;;

    stop)
        stop_servers
        ;;

    restart)
        stop_servers
        sleep 2
        exec "$0" start
        ;;

    status)
        echo "Service status:"
        pgrep -f "ollama serve" > /dev/null && echo -e "Ollama:   ${GREEN}Running${NC}" || echo -e "Ollama:   ${RED}Stopped${NC}"
        pgrep -f "python3 main.py" > /dev/null && echo -e "Backend:  ${GREEN}Running${NC}" || echo -e "Backend:  ${RED}Stopped${NC}"
        pgrep -f "next dev" > /dev/null && echo -e "Frontend: ${GREEN}Running${NC}" || echo -e "Frontend: ${RED}Stopped${NC}"
        ;;

    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
