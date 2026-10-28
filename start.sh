#!/usr/bin/env bash
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
check_command() { command -v "$1" &> /dev/null && return 0 || return 1; }
setup_project() {
    if ! check_command node; then log_error "Node.js requerido"; exit 1; fi
    if ! check_command npm; then log_error "npm requerido"; exit 1; fi
    log_success "Node.js $(node --version) | npm $(npm --version)"
    [ ! -d "node_modules" ] && { log_info "Instalando dependencias..."; npm install; log_success "Dependencias instaladas"; } || log_info "node_modules encontrado"
}
ask_port() { echo ""; read -p "$(echo -e ${CYAN}Puerto [5174]:${NC}) " PORT; PORT=${PORT:-5174}; }
show_menu() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        SHIFTMASTER START (LOCAL)       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}1)${NC} Modo Desarrollo (npm run dev)"
    echo -e "${GREEN}2)${NC} Build Producción (npm run build)"
    echo -e "${GREEN}3)${NC} Preview Build (npm run preview)"
    echo -e "${RED}4)${NC} Limpieza Completa"
    echo -e "${YELLOW}5)${NC} Salir"
    echo ""
    read -p "$(echo -e ${CYAN}Selecciona una opción [1-5]:${NC}) " OPTION
}
start_dev() { ask_port; setup_project; log_info "http://localhost:$PORT"; npm run dev -- --host 0.0.0.0 --port "$PORT"; }
start_build() { setup_project; npm run build; log_success "Build completado en ./dist"; read -p "Enter..."; }
start_preview() { ask_port; setup_project; [ ! -d "dist" ] && npm run build; npm run preview -- --host 0.0.0.0 --port "$PORT"; }
clean_complete() { read -p "¿Limpiar todo? (s/N): " C; [[ "$C" =~ ^[Ss]$ ]] && rm -rf node_modules dist .vite .cache package-lock.json *.log 2>/dev/null && log_success "Limpieza completa"; read -p "Enter..."; }
while true; do show_menu; case "$OPTION" in 1) start_dev;; 2) start_build;; 3) start_preview;; 4) clean_complete;; 5) exit 0;; *) sleep 2;; esac; done
