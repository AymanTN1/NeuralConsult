#!/bin/bash

# ============================================
# NeuralConsult Frontend OCR Build & Test Script
# ============================================
# Usage: ./build-ocr-test.sh [build|test|clean|logs]
# ============================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_IMAGE="aymantantani/neuralconsult-frontend:ocr-test"
CONTAINER_NAME="neuralconsult-frontend-ocr-test"
FRONTEND_PORT=5173

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============= FUNCTIONS =============

print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

build_image() {
  print_header "Building Docker Image for OCR Testing"
  
  print_info "Building image: $DOCKER_IMAGE"
  print_info "This will compile the frontend with OCR improvements..."
  
  cd "$PROJECT_ROOT"
  
  if docker build \
    -f docker/frontend.Dockerfile \
    -t "$DOCKER_IMAGE" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    . ; then
    print_success "Docker image built successfully!"
    print_info "Image size: $(docker images $DOCKER_IMAGE --format '{{.Size}}')"
  else
    print_error "Failed to build Docker image"
    return 1
  fi
}

run_container() {
  print_header "Starting OCR Test Container"
  
  # Check if container already running
  if docker ps --filter "name=$CONTAINER_NAME" --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
    print_warning "Container $CONTAINER_NAME already running"
    print_info "Stopping existing container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
  fi
  
  print_info "Starting container on port $FRONTEND_PORT..."
  
  docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$FRONTEND_PORT:80" \
    --health-cmd='wget --quiet --tries=1 --spider http://localhost/index.html || exit 1' \
    --health-interval=30s \
    --health-timeout=3s \
    --health-start-period=5s \
    --health-retries=3 \
    "$DOCKER_IMAGE"
  
  print_success "Container started: $CONTAINER_NAME"
  
  # Wait for container to be healthy
  print_info "Waiting for container to be healthy..."
  
  for i in {1..30}; do
    if [ "$(docker inspect -f '{{.State.Health.Status}}' $CONTAINER_NAME)" = "healthy" ]; then
      print_success "Container is healthy!"
      break
    fi
    echo -n "."
    sleep 1
  done
  
  # Check if container is still running
  if ! docker ps --filter "name=$CONTAINER_NAME" --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
    print_error "Container stopped unexpectedly"
    docker logs "$CONTAINER_NAME"
    return 1
  fi
  
  print_success "OCR Frontend is ready for testing!"
  print_info "Access it at: http://localhost:$FRONTEND_PORT"
  print_info "Identity OCR Verifier: http://localhost:$FRONTEND_PORT/#/register"
}

test_ocr() {
  print_header "Testing OCR Container"
  
  if ! docker ps --filter "name=$CONTAINER_NAME" --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
    print_error "Container $CONTAINER_NAME is not running"
    print_info "Run './build-ocr-test.sh build' then './build-ocr-test.sh test'"
    return 1
  fi
  
  print_info "Container health status:"
  docker inspect "$CONTAINER_NAME" --format='{{json .State.Health}}' | jq .
  
  print_info "Testing HTTP connectivity..."
  if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null; then
    print_success "Frontend is responding to HTTP requests"
  else
    print_error "Frontend is not responding"
    return 1
  fi
  
  print_success "All tests passed!"
  print_info "\nManual Testing Checklist:"
  echo "  1. Navigate to http://localhost:$FRONTEND_PORT/#/register"
  echo "  2. Fill in user details"
  echo "  3. Try uploading identity card images:"
  echo "     - Valid: JPEG/PNG, 500-3000px, landscape, non-blurry"
  echo "     - Invalid: Small, portrait, blurry, wrong format"
  echo "  4. Test auto-rotation: Upload image rotated 90°"
  echo "  5. Verify error messages are clear and specific"
}

show_logs() {
  print_header "Container Logs"
  if docker ps --filter "name=$CONTAINER_NAME" --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
    docker logs -f "$CONTAINER_NAME"
  else
    print_error "Container $CONTAINER_NAME is not running"
  fi
}

clean_up() {
  print_header "Cleaning Up"
  
  print_info "Stopping container..."
  docker stop "$CONTAINER_NAME" 2>/dev/null || print_warning "Container not running"
  
  print_info "Removing container..."
  docker rm "$CONTAINER_NAME" 2>/dev/null || print_warning "Container not found"
  
  print_success "Cleanup completed"
}

show_usage() {
  cat << EOF
${BLUE}════════════════════════════════════════════════════${NC}
${BLUE}NeuralConsult OCR Frontend Build & Test Script${NC}
${BLUE}════════════════════════════════════════════════════${NC}

Usage: $0 [command]

Commands:
  ${GREEN}build${NC}       - Build Docker image for OCR testing
  ${GREEN}run${NC}         - Start the Docker container
  ${GREEN}test${NC}        - Run tests on the running container
  ${GREEN}logs${NC}        - View container logs
  ${GREEN}clean${NC}       - Stop and remove the test container
  ${GREEN}all${NC}         - Build, run, and test (full workflow)
  ${GREEN}help${NC}        - Show this help message

Examples:
  $0 build              # Build the image
  $0 run                # Start container
  $0 test               # Test the running container
  $0 all                # Do everything
  $0 clean              # Clean up

Testing the OCR Improvements:
  1. Run: $0 all
  2. Open: http://localhost:$FRONTEND_PORT/#/register
  3. Test with different card images:
     ✓ Good: Clear JPEG, landscape, 800×500px+
     ✗ Bad: Blurry, portrait, <500px
  4. Verify validation feedback is immediate and specific

Container Info:
  Image: $DOCKER_IMAGE
  Container: $CONTAINER_NAME
  Port: $FRONTEND_PORT

${BLUE}════════════════════════════════════════════════════${NC}
EOF
}

# ============= MAIN SCRIPT =============

case "${1:-help}" in
  build)
    build_image
    ;;
  run)
    run_container
    ;;
  test)
    test_ocr
    ;;
  logs)
    show_logs
    ;;
  clean)
    clean_up
    ;;
  all)
    print_header "Running Full Workflow"
    build_image && run_container && test_ocr
    print_success "Full workflow completed!"
    ;;
  help|--help|-h)
    show_usage
    ;;
  *)
    print_error "Unknown command: $1"
    show_usage
    exit 1
    ;;
esac
