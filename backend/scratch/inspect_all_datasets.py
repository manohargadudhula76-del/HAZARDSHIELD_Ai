import os
import json
import zipfile
import pandas as pd
import numpy as np
from pathlib import Path

raw_dir = Path("datasets/raw")

def inspect_file(file_path):
    rel_path = file_path.relative_to(raw_dir)
    domain = file_path.parent.name
    ext = file_path.suffix.lower()
    
    print(f"\n==================================================")
    print(f"INSPECTING: {rel_path} (Domain: {domain})")
    print(f"File Size: {file_path.stat().st_size / 1024:.2f} KB")
    print(f"==================================================")
    
    if ext == '.zip':
        print(f"Zip file containing archive contents.")
        try:
            with zipfile.ZipFile(file_path, 'r') as z:
                nl = z.namelist()
                print("Files inside zip:", nl[:10])
                # If GeoJSON inside zip
                geojson_files = [f for f in nl if f.endswith('.geojson') or f.endswith('.json')]
                if geojson_files:
                    with z.open(geojson_files[0]) as f:
                        data = json.load(f)
                        features = data.get("features", [])
                        print(f"GeoJSON Total Features: {len(features)}")
                        if features:
                            sample_props = features[0].get("properties", {})
                            print("GeoJSON Properties Sample:", list(sample_props.keys()))
        except Exception as e:
            print("Error reading zip file:", e)
        return

    if ext == '.kmz':
        print("KMZ spatial archive file detected.")
        return

    try:
        # Load sample or full dataframe
        df = pd.read_csv(file_path, low_memory=False)
        print(f"Rows: {len(df)}, Columns: {len(df.columns)}")
        print("Column Names:", list(df.columns))
        print("\nMissing Value Summary (Top missing):")
        missing = df.isna().sum()
        missing_pct = (missing / len(df) * 100).round(2)
        missing_df = pd.DataFrame({"Missing Count": missing, "Missing Pct (%)": missing_pct})
        print(missing_df[missing_df["Missing Count"] > 0].head(10))
        
        dup_count = df.duplicated().sum()
        print(f"Duplicate Rows Count: {dup_count}")
        
        print("\nFirst 2 Rows:")
        print(df.head(2).to_dict(orient="records"))
    except Exception as e:
        print(f"Error inspecting file {file_path}: {e}")

for root, dirs, files in os.walk(raw_dir):
    for f in files:
        if not f.startswith('.'):
            inspect_file(Path(root) / f)
