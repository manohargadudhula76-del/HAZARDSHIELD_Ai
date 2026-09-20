"""
CLI Script to run dataset preprocessing and generate master_habitations.csv
Usage: python scripts/process_datasets.py
"""
import sys
from pathlib import Path

# Add parent backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.dataset_pipeline import DatasetPipeline

def main():
    print("==================================================")
    print("HazardShield AI — Preprocessing & Master Dataset Generation")
    print("==================================================")

    pipeline = DatasetPipeline(base_dir=backend_dir / "datasets")
    result = pipeline.run_full_pipeline(overwrite_master=True, save_report_json=True)

    print("\nPipeline Execution Summary:")
    print(f"Status: {result.get('status')}")
    if result.get("status") == "success":
        print(f"Master Dataset Path: {result.get('master_dataset_path')}")
        print(f"Total Master Records: {result.get('total_master_records')}")
    else:
        print(f"Message: {result.get('message')}")

if __name__ == "__main__":
    main()
