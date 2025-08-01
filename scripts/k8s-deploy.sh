#!/bin/bash
set -e

# Kubernetes Deployment Script for Financial Analyzer
echo "☸️  Financial Analyzer Kubernetes Deployment"
echo "============================================"

# Configuration
NAMESPACE="financial-analyzer"
REGISTRY=${DOCKER_REGISTRY:-"financial-analyzer"}
TAG=${IMAGE_TAG:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Kubernetes cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # API
    log_info "Building API image..."
    docker build -t "${REGISTRY}/api:${TAG}" -f apps/api/Dockerfile .
    docker push "${REGISTRY}/api:${TAG}"
    
    # Web
    log_info "Building Web image..."
    docker build -t "${REGISTRY}/web:${TAG}" -f apps/web/Dockerfile .
    docker push "${REGISTRY}/web:${TAG}"
    
    # Document Parser
    log_info "Building Document Parser image..."
    docker build -t "${REGISTRY}/document-parser:${TAG}" mcp-servers/document-parser/
    docker push "${REGISTRY}/document-parser:${TAG}"
    
    # Constraint Engine
    log_info "Building Constraint Engine image..."
    docker build -t "${REGISTRY}/constraint-engine:${TAG}" mcp-servers/constraint-engine/
    docker push "${REGISTRY}/constraint-engine:${TAG}"
    
    # Alert Manager
    log_info "Building Alert Manager image..."
    docker build -t "${REGISTRY}/alert-manager:${TAG}" mcp-servers/alert-manager/
    docker push "${REGISTRY}/alert-manager:${TAG}"
    
    # AI Analyzer
    log_info "Building AI Analyzer image..."
    docker build -t "${REGISTRY}/ai-analyzer:${TAG}" mcp-servers/ai-analyzer/
    docker push "${REGISTRY}/ai-analyzer:${TAG}"
    
    log_success "All images built and pushed successfully"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    log_info "Deploying to Kubernetes..."
    
    # Create namespace
    log_info "Creating namespace..."
    kubectl apply -f k8s/namespace.yaml
    
    # Apply ConfigMap and Secrets
    log_info "Applying configuration..."
    kubectl apply -f k8s/configmap.yaml
    
    # Deploy infrastructure services
    log_info "Deploying infrastructure services..."
    kubectl apply -f k8s/postgres.yaml
    kubectl apply -f k8s/redis.yaml
    
    # Wait for infrastructure to be ready
    log_info "Waiting for infrastructure services..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n $NAMESPACE
    
    # Deploy application services
    log_info "Deploying application services..."
    kubectl apply -f k8s/api.yaml
    kubectl apply -f k8s/web.yaml
    kubectl apply -f k8s/mcp-services.yaml
    
    # Wait for application services
    log_info "Waiting for application services..."
    kubectl wait --for=condition=available --timeout=300s deployment/api -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/web -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/document-parser -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/constraint-engine -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/alert-manager -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/ai-analyzer -n $NAMESPACE
    
    # Apply ingress
    log_info "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    log_success "Kubernetes deployment completed"
}

# Check deployment status
check_deployment() {
    log_info "Checking deployment status..."
    
    echo ""
    echo "📊 Namespace: $NAMESPACE"
    kubectl get namespace $NAMESPACE
    
    echo ""
    echo "🏗️  Deployments:"
    kubectl get deployments -n $NAMESPACE
    
    echo ""
    echo "🔧 Services:"
    kubectl get services -n $NAMESPACE
    
    echo ""
    echo "📦 Pods:"
    kubectl get pods -n $NAMESPACE
    
    echo ""
    echo "🌐 Ingress:"
    kubectl get ingress -n $NAMESPACE
    
    # Get ingress IP
    INGRESS_IP=$(kubectl get ingress financial-analyzer-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -n "$INGRESS_IP" ]; then
        log_success "Application available at: http://$INGRESS_IP"
    else
        log_warning "Ingress IP not yet assigned. Check ingress controller status."
        log_info "For local development, you can use port-forward:"
        log_info "kubectl port-forward service/web-service 3000:3000 -n $NAMESPACE"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up deployment..."
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    log_success "Cleanup completed"
}

# Main execution
case "${1:-deploy}" in
    "build")
        check_prerequisites
        build_and_push_images
        ;;
    "deploy")
        check_prerequisites
        build_and_push_images
        deploy_to_k8s
        check_deployment
        ;;
    "status")
        check_deployment
        ;;
    "cleanup")
        cleanup
        ;;
    "logs")
        SERVICE=${2:-api}
        kubectl logs -f deployment/$SERVICE -n $NAMESPACE
        ;;
    *)
        echo "Usage: $0 {build|deploy|status|cleanup|logs [service]}"
        echo ""
        echo "Commands:"
        echo "  build    - Build and push Docker images"
        echo "  deploy   - Full deployment (build + deploy)"
        echo "  status   - Check deployment status"
        echo "  cleanup  - Remove all resources"
        echo "  logs     - View logs for a service"
        exit 1
        ;;
esac

log_success "Script completed successfully!"