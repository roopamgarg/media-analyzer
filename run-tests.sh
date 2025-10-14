#!/bin/bash

# Media Analyzer - Comprehensive Test Runner
# This script runs all unit tests for both Node.js and Python services

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run Node.js tests
run_node_tests() {
    print_status "Running Node.js API tests..."
    
    if [ ! -d "apps/api" ]; then
        print_error "Node.js API directory not found!"
        return 1
    fi
    
    cd apps/api
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
    
    # Run Node.js tests
    print_status "Running Node.js unit tests..."
    npm run test:unit
    
    print_status "Running Node.js integration tests..."
    npm run test:integration
    
    print_success "Node.js tests completed successfully!"
    cd ../..
}

# Function to run Python tests
run_python_tests() {
    print_status "Running Python worker tests..."
    
    if [ ! -d "apps/worker-python" ]; then
        print_error "Python worker directory not found!"
        return 1
    fi
    
    cd apps/worker-python
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating Python virtual environment..."
    source venv/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "venv/pyvenv.cfg" ] || [ ! -d "venv/lib/python3.13/site-packages/pytest" ]; then
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    
    # Run Python tests
    print_status "Running Python unit tests..."
    python -m pytest tests/unit/ -v
    
    print_status "Running Python integration tests..."
    python -m pytest tests/integration/ -v
    
    print_success "Python tests completed successfully!"
    cd ../..
}

# Function to run all tests with coverage
run_all_tests_with_coverage() {
    print_status "Running all tests with coverage..."
    
    # Node.js coverage
    print_status "Running Node.js tests with coverage..."
    cd apps/api
    npm run test:coverage
    cd ../..
    
    # Python coverage
    print_status "Running Python tests with coverage..."
    cd apps/worker-python
    source venv/bin/activate
    python -m pytest tests/ --cov=. --cov-report=html --cov-report=term-missing
    cd ../..
    
    print_success "All tests with coverage completed!"
}

# Function to run specific test suites
run_specific_tests() {
    local service=$1
    local test_type=$2
    
    case $service in
        "node"|"api")
            cd apps/api
            case $test_type in
                "unit")
                    npm run test:unit
                    ;;
                "integration")
                    npm run test:integration
                    ;;
                "all")
                    npm test
                    ;;
                *)
                    print_error "Invalid test type for Node.js. Use: unit, integration, or all"
                    exit 1
                    ;;
            esac
            cd ../..
            ;;
        "python"|"worker")
            cd apps/worker-python
            source venv/bin/activate
            case $test_type in
                "unit")
                    python -m pytest tests/unit/ -v
                    ;;
                "integration")
                    python -m pytest tests/integration/ -v
                    ;;
                "all")
                    python -m pytest tests/ -v
                    ;;
                *)
                    print_error "Invalid test type for Python. Use: unit, integration, or all"
                    exit 1
                    ;;
            esac
            cd ../..
            ;;
        *)
            print_error "Invalid service. Use: node, python, api, or worker"
            exit 1
            ;;
    esac
}

# Function to show help
show_help() {
    echo "Media Analyzer Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --node, -n              Run only Node.js tests"
    echo "  --python, -p            Run only Python tests"
    echo "  --coverage, -c          Run all tests with coverage"
    echo "  --specific SERVICE TYPE Run specific test suite"
    echo "                          SERVICE: node|python"
    echo "                          TYPE: unit|integration|all"
    echo "  --help, -h              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Run all tests"
    echo "  $0 --node               # Run only Node.js tests"
    echo "  $0 --python             # Run only Python tests"
    echo "  $0 --coverage           # Run all tests with coverage"
    echo "  $0 --specific node unit # Run only Node.js unit tests"
    echo "  $0 --specific python integration # Run only Python integration tests"
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    print_status "Starting Media Analyzer test suite..."
    echo ""
    
    # Parse command line arguments
    case "${1:-}" in
        "--node"|"-n")
            run_node_tests
            ;;
        "--python"|"-p")
            run_python_tests
            ;;
        "--coverage"|"-c")
            run_all_tests_with_coverage
            ;;
        "--specific")
            if [ -z "$2" ] || [ -z "$3" ]; then
                print_error "Usage: $0 --specific SERVICE TYPE"
                show_help
                exit 1
            fi
            run_specific_tests "$2" "$3"
            ;;
        "--help"|"-h")
            show_help
            exit 0
            ;;
        "")
            # Run all tests by default
            print_status "Running all tests..."
            echo ""
            
            # Run Node.js tests
            run_node_tests
            echo ""
            
            # Run Python tests
            run_python_tests
            echo ""
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_success "All tests completed in ${duration} seconds!"
}

# Run main function with all arguments
main "$@"
