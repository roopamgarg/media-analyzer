#!/usr/bin/env python3
"""
Comprehensive coverage reporting script for Python worker service
"""
import subprocess
import sys
import os
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any


class CoverageReporter:
    """Generate comprehensive coverage reports for the Python worker service."""
    
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path(__file__).parent.parent
        self.test_dir = self.project_root / "tests"
        self.coverage_dir = self.project_root / "htmlcov"
        self.coverage_json = self.project_root / "coverage.json"
        
    def run_tests_with_coverage(self, verbose: bool = True) -> Dict[str, Any]:
        """Run all tests with coverage and return results."""
        print("🧪 Running tests with coverage...")
        
        cmd = [
            sys.executable, "-m", "pytest",
            str(self.test_dir),
            "--cov=.",
            "--cov-report=html",
            "--cov-report=json",
            "--cov-report=term-missing",
            "--cov-exclude=tests/*",
            "--cov-exclude=venv/*",
            "--cov-exclude=__pycache__/*",
            "--cov-exclude=*.pyc",
            "-v" if verbose else "-q"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            
            if result.returncode != 0:
                print(f"❌ Tests failed with return code {result.returncode}")
                print("STDERR:", result.stderr)
                return {"success": False, "error": result.stderr}
            
            print("✅ Tests completed successfully!")
            return {"success": True, "stdout": result.stdout, "stderr": result.stderr}
            
        except Exception as e:
            print(f"❌ Error running tests: {e}")
            return {"success": False, "error": str(e)}
    
    def parse_coverage_data(self) -> Dict[str, Any]:
        """Parse coverage data from JSON report."""
        if not self.coverage_json.exists():
            print("❌ Coverage JSON file not found. Run tests with coverage first.")
            return {}
        
        try:
            with open(self.coverage_json, 'r') as f:
                coverage_data = json.load(f)
            
            return coverage_data
        except Exception as e:
            print(f"❌ Error parsing coverage data: {e}")
            return {}
    
    def generate_coverage_summary(self, coverage_data: Dict[str, Any]) -> str:
        """Generate a detailed coverage summary."""
        if not coverage_data:
            return "No coverage data available."
        
        summary = []
        summary.append("📊 Coverage Summary")
        summary.append("=" * 50)
        
        # Overall coverage
        total_coverage = coverage_data.get('totals', {})
        summary.append(f"Overall Coverage: {total_coverage.get('percent_covered', 0):.1f}%")
        summary.append(f"Lines Covered: {total_coverage.get('covered_lines', 0)}")
        summary.append(f"Lines Missing: {total_coverage.get('missing_lines', 0)}")
        summary.append(f"Total Lines: {total_coverage.get('num_statements', 0)}")
        summary.append("")
        
        # File-by-file coverage
        files = coverage_data.get('files', {})
        if files:
            summary.append("📁 File-by-File Coverage:")
            summary.append("-" * 30)
            
            # Sort files by coverage percentage
            sorted_files = sorted(
                files.items(),
                key=lambda x: x[1].get('summary', {}).get('percent_covered', 0),
                reverse=True
            )
            
            for file_path, file_data in sorted_files:
                file_summary = file_data.get('summary', {})
                coverage_pct = file_summary.get('percent_covered', 0)
                covered_lines = file_summary.get('covered_lines', 0)
                missing_lines = file_summary.get('missing_lines', 0)
                
                # Color coding based on coverage
                if coverage_pct >= 90:
                    status = "🟢"
                elif coverage_pct >= 70:
                    status = "🟡"
                else:
                    status = "🔴"
                
                summary.append(f"{status} {file_path}: {coverage_pct:.1f}% ({covered_lines}/{covered_lines + missing_lines})")
        
        return "\n".join(summary)
    
    def identify_coverage_gaps(self, coverage_data: Dict[str, Any]) -> List[str]:
        """Identify files with low coverage."""
        gaps = []
        files = coverage_data.get('files', {})
        
        for file_path, file_data in files.items():
            file_summary = file_data.get('summary', {})
            coverage_pct = file_summary.get('percent_covered', 0)
            
            if coverage_pct < 80:  # Threshold for low coverage
                gaps.append(f"❌ {file_path}: {coverage_pct:.1f}% (below 80% threshold)")
            elif coverage_pct < 90:
                gaps.append(f"⚠️  {file_path}: {coverage_pct:.1f}% (below 90% threshold)")
        
        return gaps
    
    def generate_missing_lines_report(self, coverage_data: Dict[str, Any]) -> str:
        """Generate report of missing lines for each file."""
        report = []
        report.append("🔍 Missing Lines Report")
        report.append("=" * 50)
        
        files = coverage_data.get('files', {})
        for file_path, file_data in files.items():
            missing_lines = file_data.get('missing_lines', [])
            if missing_lines:
                report.append(f"\n📄 {file_path}:")
                report.append(f"   Missing lines: {missing_lines}")
        
        return "\n".join(report)
    
    def export_coverage_for_ci(self, coverage_data: Dict[str, Any]) -> str:
        """Export coverage data in CI-friendly format."""
        if not coverage_data:
            return ""
        
        total_coverage = coverage_data.get('totals', {})
        coverage_pct = total_coverage.get('percent_covered', 0)
        
        # Create CI-friendly output
        ci_output = []
        ci_output.append(f"COVERAGE_PERCENTAGE={coverage_pct:.1f}")
        ci_output.append(f"COVERED_LINES={total_coverage.get('covered_lines', 0)}")
        ci_output.append(f"MISSING_LINES={total_coverage.get('missing_lines', 0)}")
        ci_output.append(f"TOTAL_LINES={total_coverage.get('num_statements', 0)}")
        
        return "\n".join(ci_output)
    
    def run_full_coverage_analysis(self, verbose: bool = True) -> bool:
        """Run complete coverage analysis."""
        print("🚀 Starting comprehensive coverage analysis...")
        print("=" * 60)
        
        # Step 1: Run tests with coverage
        test_result = self.run_tests_with_coverage(verbose)
        if not test_result["success"]:
            print("❌ Failed to run tests. Cannot generate coverage report.")
            return False
        
        # Step 2: Parse coverage data
        print("\n📊 Parsing coverage data...")
        coverage_data = self.parse_coverage_data()
        if not coverage_data:
            print("❌ No coverage data found.")
            return False
        
        # Step 3: Generate summary
        print("\n📈 Generating coverage summary...")
        summary = self.generate_coverage_summary(coverage_data)
        print(summary)
        
        # Step 4: Identify gaps
        print("\n🔍 Identifying coverage gaps...")
        gaps = self.identify_coverage_gaps(coverage_data)
        if gaps:
            print("⚠️  Coverage gaps found:")
            for gap in gaps:
                print(f"   {gap}")
        else:
            print("✅ All files meet coverage thresholds!")
        
        # Step 5: Missing lines report
        if verbose:
            print("\n📋 Missing lines report:")
            missing_lines_report = self.generate_missing_lines_report(coverage_data)
            print(missing_lines_report)
        
        # Step 6: Export for CI
        print("\n🔄 Exporting coverage data for CI...")
        ci_data = self.export_coverage_for_ci(coverage_data)
        if ci_data:
            print("CI Environment Variables:")
            print(ci_data)
        
        # Step 7: HTML report location
        if self.coverage_dir.exists():
            print(f"\n📁 HTML coverage report available at: {self.coverage_dir}/index.html")
        
        print("\n✅ Coverage analysis completed!")
        return True


def main():
    """Main entry point for coverage reporting."""
    parser = argparse.ArgumentParser(description="Generate comprehensive coverage reports")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--project-root", help="Project root directory")
    parser.add_argument("--output", "-o", help="Output file for coverage summary")
    
    args = parser.parse_args()
    
    # Create coverage reporter
    reporter = CoverageReporter(args.project_root)
    
    # Run full analysis
    success = reporter.run_full_coverage_analysis(args.verbose)
    
    if args.output:
        # Save summary to file
        coverage_data = reporter.parse_coverage_data()
        summary = reporter.generate_coverage_summary(coverage_data)
        
        with open(args.output, 'w') as f:
            f.write(summary)
        
        print(f"\n📄 Coverage summary saved to: {args.output}")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
