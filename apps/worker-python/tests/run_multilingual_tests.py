#!/usr/bin/env python3
"""
Test runner for multilingual ASR features
"""
import subprocess
import sys
import os
from pathlib import Path


def run_tests():
    """Run all multilingual tests."""
    print("🧪 Running Multilingual ASR Tests")
    print("=" * 50)
    
    # Get the test directory
    test_dir = Path(__file__).parent
    
    # Test categories
    test_categories = [
        {
            "name": "Audio Preprocessing Tests",
            "path": "unit/test_audio_preprocessing.py",
            "description": "Testing audio preprocessing functionality"
        },
        {
            "name": "Text Post-processing Tests", 
            "path": "unit/test_text_postprocessing.py",
            "description": "Testing text post-processing functionality"
        },
        {
            "name": "Language Configuration Tests",
            "path": "unit/test_language_config.py", 
            "description": "Testing language configuration functionality"
        },
        {
            "name": "Multilingual ASR Tests",
            "path": "unit/test_main.py::TestMultilingualASR",
            "description": "Testing multilingual ASR endpoints"
        },
        {
            "name": "Enhanced ASR Features Tests",
            "path": "unit/test_main.py::TestEnhancedASRFeatures",
            "description": "Testing enhanced ASR features"
        },
        {
            "name": "Multilingual Integration Tests",
            "path": "integration/test_multilingual_workflows.py",
            "description": "Testing multilingual workflows"
        }
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for category in test_categories:
        print(f"\n📋 {category['name']}")
        print(f"   {category['description']}")
        print("-" * 50)
        
        test_path = test_dir / category["path"]
        
        if not test_path.exists():
            print(f"❌ Test file not found: {test_path}")
            continue
        
        try:
            # Run pytest for this category
            cmd = [
                sys.executable, "-m", "pytest", 
                str(test_path),
                "-v",  # Verbose output
                "--tb=short",  # Short traceback
                "--no-header",  # No pytest header
                "--disable-warnings"  # Disable warnings for cleaner output
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=test_dir.parent)
            
            if result.returncode == 0:
                print("✅ All tests passed")
                # Count passed tests from output
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'PASSED' in line:
                        passed_tests += 1
                        total_tests += 1
            else:
                print("❌ Some tests failed")
                print("STDOUT:", result.stdout)
                print("STDERR:", result.stderr)
                # Count failed tests from output
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'FAILED' in line:
                        failed_tests += 1
                        total_tests += 1
                    elif 'PASSED' in line:
                        passed_tests += 1
                        total_tests += 1
                        
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            failed_tests += 1
            total_tests += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    
    if failed_tests == 0:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n💥 {failed_tests} tests failed!")
        return 1


def run_coverage_tests():
    """Run tests with coverage reporting."""
    print("\n📊 Running Tests with Coverage")
    print("=" * 50)
    
    test_dir = Path(__file__).parent
    
    try:
        cmd = [
            sys.executable, "-m", "pytest",
            "unit/test_audio_preprocessing.py",
            "unit/test_text_postprocessing.py", 
            "unit/test_language_config.py",
            "unit/test_main.py::TestMultilingualASR",
            "unit/test_main.py::TestEnhancedASRFeatures",
            "integration/test_multilingual_workflows.py",
            "--cov=audio_preprocessing",
            "--cov=text_postprocessing", 
            "--cov=language_config",
            "--cov=main",
            "--cov-report=html",
            "--cov-report=term-missing",
            "-v"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=test_dir.parent)
        
        print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
            
        return result.returncode
        
    except Exception as e:
        print(f"❌ Error running coverage tests: {e}")
        return 1


def run_specific_language_tests(language):
    """Run tests for a specific language."""
    print(f"\n🌍 Running Tests for {language.upper()}")
    print("=" * 50)
    
    test_dir = Path(__file__).parent
    
    try:
        cmd = [
            sys.executable, "-m", "pytest",
            "unit/test_main.py::TestMultilingualASR",
            "integration/test_multilingual_workflows.py",
            "-k", f"language_{language}",
            "-v"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=test_dir.parent)
        
        print("STDOUT:", result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
            
        return result.returncode
        
    except Exception as e:
        print(f"❌ Error running {language} tests: {e}")
        return 1


def main():
    """Main test runner."""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "coverage":
            return run_coverage_tests()
        elif command == "language" and len(sys.argv) > 2:
            language = sys.argv[2]
            return run_specific_language_tests(language)
        elif command == "help":
            print("Usage:")
            print("  python run_multilingual_tests.py              # Run all tests")
            print("  python run_multilingual_tests.py coverage     # Run with coverage")
            print("  python run_multilingual_tests.py language hi  # Run Hindi tests")
            print("  python run_multilingual_tests.py help         # Show this help")
            return 0
        else:
            print(f"Unknown command: {command}")
            return 1
    else:
        return run_tests()


if __name__ == "__main__":
    sys.exit(main())
