#!/usr/bin/env bash
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
check_command() { command -v "$1" &> /dev/null && return 0 || return 1; }
create_dockerfile_dev() { [ -f "Dockerfile.dev" ] && return; cat > Dockerfile.dev << 'D'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
D
}
create_dockerfile() { [ -f "Dockerfile" ] && return; cat > Dockerfile << 'D'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
D
}
create_nginx_conf() { [ -f "nginx.conf" ] && return; cat > nginx.conf << 'N'
server { listen 80; server_name localhost; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } gzip on; gzip_types text/plain text/css application/json application/javascript; }
N
}
create_compose_dev() { [ -f "docker-compose.dev.yml" ] && return; cat > docker-compose.dev.yml << C
version: '3.8'
services:
  shiftmaster-dev:
    build: { context: ., dockerfile: Dockerfile.dev }
    ports: ["${PORT}:5174"]
    volumes: [".:/app", "/app/node_modules"]
    environment: ["NODE_ENV=development"]
C
}
create_compose() { [ -f "docker-compose.yml" ] && return; cat > docker-compose.yml << C
version: '3.8'
services:
  shiftmaster:
    build: { context: ., dockerfile: Dockerfile }
    ports: ["${PORT}:80"]
    restart: unless-stopped
C
}
ask_port() { echo ""; read -p "$(echo -e ${CYAN}Puerto [5174]:${NC}) " PORT; PORT=${PORT:-5174}; }
show_menu() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       SHIFTMASTER START (DOCKER)       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Modo Desarrollo con Docker"
    echo -e "${GREEN}2)${NC} Modo Producción con Docker"
    echo -e "${RED}3)${NC} Detener y Limpiar"
    echo -e "${YELLOW}4)${NC} Limpieza Completa Docker"
    echo -e "${BLUE}5)${NC} Salir"
    echo ""
    read -p "$(echo -e ${CYAN}Selecciona [1-5]:${NC}) " OPTION
}
while true; do
    show_menu
    case "$OPTION" in
        1) check_command docker || exit 1; ask_port; create_dockerfile_dev; create_compose_dev; docker compose -f docker-compose.dev.yml up --build;;
        2) check_command docker || exit 1; ask_port; create_dockerfile; create_nginx_conf; create_compose; docker compose up --build -d; log_success "Levantado en http://localhost:$PORT"; read -p "Enter...";;
        3) docker compose down 2>/dev/null; docker compose -f docker-compose.dev.yml down 2>/dev/null; log_success "Detenido"; read -p "Enter...";;
        4) docker compose down -v 2>/dev/null; rm -f Dockerfile Dockerfile.dev docker-compose.yml docker-compose.dev.yml nginx.conf; log_success "Limpio"; read -p "Enter...";;
        5) exit 0;;
        *) sleep 2;;
    esac
done
