import os
import json
import zipfile
import pandas as pd
from pathlib import Path
from typing import Union

try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False


class DataLoader:
    """
    Robust data loader service supporting CSV, JSON, GeoJSON, and Zip spatial archives.
    Returns Pandas DataFrames or GeoPandas GeoDataFrames.
    """

    @staticmethod
    def detect_format(filepath: Union[str, Path]) -> str:
        """
        Detects file format based on extension and content inspection.
        """
        path = Path(filepath)
        ext = path.suffix.lower()

        if ext in ['.csv', '.txt']:
            return 'csv'
        elif ext == '.geojson':
            return 'geojson'
        elif ext == '.zip':
            return 'zip'
        elif ext == '.kmz':
            return 'kmz'
        elif ext in ['.json']:
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    sample = f.read(1024)
                    if '"FeatureCollection"' in sample or '"Feature"' in sample or '"geometry"' in sample:
                        return 'geojson'
            except Exception:
                pass
            return 'json'
        return 'unknown'

    @classmethod
    def load_csv(cls, filepath: Union[str, Path], **kwargs) -> pd.DataFrame:
        """
        Safely loads a CSV file into a Pandas DataFrame.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found at path: '{path}'")

        try:
            kwargs.setdefault('low_memory', False)
            df = pd.read_csv(path, **kwargs)
            if df.empty:
                raise ValueError(f"CSV dataset at '{path}' is empty.")
            return df
        except FileNotFoundError:
            raise
        except Exception as e:
            raise ValueError(f"Failed to parse CSV file at '{path}': {str(e)}") from e

    @classmethod
    def load_json(cls, filepath: Union[str, Path], **kwargs) -> pd.DataFrame:
        """
        Safely loads a JSON file into a Pandas DataFrame.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found at path: '{path}'")

        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if isinstance(data, list):
                df = pd.DataFrame(data)
            elif isinstance(data, dict):
                if "records" in data and isinstance(data["records"], list):
                    df = pd.DataFrame(data["records"])
                elif "data" in data and isinstance(data["data"], list):
                    df = pd.DataFrame(data["data"])
                else:
                    df = pd.DataFrame([data])
            else:
                raise ValueError(f"JSON content in '{path}' must be a list or dictionary.")

            if df.empty:
                raise ValueError(f"JSON dataset at '{path}' is empty.")
            return df
        except FileNotFoundError:
            raise
        except Exception as e:
            raise ValueError(f"Invalid or corrupted JSON file at '{path}': {str(e)}") from e

    @classmethod
    def load_geojson(cls, filepath: Union[str, Path], **kwargs) -> Union[pd.DataFrame, 'gpd.GeoDataFrame']:
        """
        Safely loads a GeoJSON file into a GeoPandas GeoDataFrame (or Pandas DataFrame fallback).
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Dataset file not found at path: '{path}'")

        if HAS_GEOPANDAS:
            try:
                gdf = gpd.read_file(path, **kwargs)
                if gdf.empty:
                    raise ValueError(f"GeoJSON dataset at '{path}' is empty.")
                return gdf
            except FileNotFoundError:
                raise
            except Exception as e:
                raise ValueError(f"Invalid or corrupted GeoJSON file at '{path}': {str(e)}") from e

        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            features = data.get("features", [])
            records = []
            for feat in features:
                props = feat.get("properties", {}).copy()
                geom = feat.get("geometry", {})
                if geom and geom.get("type") == "Point" and "coordinates" in geom:
                    coords = geom["coordinates"]
                    if len(coords) >= 2:
                        props["longitude"] = coords[0]
                        props["latitude"] = coords[1]
                records.append(props)

            df = pd.DataFrame(records)
            if df.empty:
                raise ValueError(f"GeoJSON dataset at '{path}' is empty.")
            return df
        except FileNotFoundError:
            raise
        except Exception as e:
            raise ValueError(f"Failed to parse GeoJSON file at '{path}': {str(e)}") from e

    @classmethod
    def load_zip(cls, filepath: Union[str, Path], **kwargs) -> pd.DataFrame:
        """
        Safely extracts and loads JSON/GeoJSON/CSV content from a zip archive.
        """
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Zip dataset file not found at path: '{path}'")

        try:
            with zipfile.ZipFile(path, 'r') as z:
                files = z.namelist()
                json_files = [f for f in files if f.lower().endswith('.geojson') or f.lower().endswith('.json')]
                csv_files = [f for f in files if f.lower().endswith('.csv')]

                if json_files:
                    try:
                        import io
                        import geopandas as gpd
                        content = z.read(json_files[0])
                        return gpd.read_file(io.BytesIO(content))
                    except Exception:
                        with z.open(json_files[0]) as f:
                            data = json.load(f)
                        features = data.get("features", [])
                        records = [feat.get("properties", {}) for feat in features]
                        return pd.DataFrame(records)
                elif csv_files:
                    with z.open(csv_files[0]) as f:
                        return pd.read_csv(f, low_memory=False)
                else:
                    return pd.DataFrame([{"zip_name": path.name, "file_count": len(files)}])
        except Exception as e:
            raise ValueError(f"Failed to read zip archive at '{path}': {str(e)}") from e

    @classmethod
    def load_file(cls, filepath: Union[str, Path], **kwargs) -> Union[pd.DataFrame, 'gpd.GeoDataFrame']:
        """
        Autodetects format and loads file into DataFrame/GeoDataFrame.
        """
        fmt = cls.detect_format(filepath)
        if fmt == 'csv':
            return cls.load_csv(filepath, **kwargs)
        elif fmt == 'geojson':
            return cls.load_geojson(filepath, **kwargs)
        elif fmt == 'json':
            return cls.load_json(filepath, **kwargs)
        elif fmt == 'zip':
            return cls.load_zip(filepath, **kwargs)
        elif fmt == 'kmz':
            return pd.DataFrame([{"file": Path(filepath).name, "type": "kmz"}])
        else:
            raise ValueError(f"Unsupported dataset format for file: '{filepath}'")

