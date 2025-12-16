# convert_csv_to_json.py - FIXED VERSION with error handling
import pandas as pd
import json
import numpy as np

def safe_float_convert(value, default=0.0):
    """Safely convert value to float, handle empty strings and NaN"""
    if pd.isna(value) or value == '' or value == 'None':
        return default
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return default

def safe_string_convert(value, default=''):
    """Safely convert value to string"""
    if pd.isna(value) or value == 'None':
        return default
    return str(value).strip()

def convert_csv_to_json():
    """Convert drugs CSV to JSON for frontend with proper error handling"""
    try:
        print("🔄 Loading CSV file...")
        # Load your CSV file
        df = pd.read_csv('drugs_side_effects.csv')
        print(f"✅ Loaded {len(df)} rows from CSV")
        
        # Print column names to verify
        print(f"📋 CSV Columns: {list(df.columns)}")
        
        # Clean and prepare data
        drugs_data = []
        
        for index, row in df.iterrows():
            try:
                drug_entry = {
                    "generic_name": safe_string_convert(row.get('generic_name', '')),
                    "drug_classes": safe_string_convert(row.get('drug_classes', '')),
                    "brand_names": safe_string_convert(row.get('brand_names', '')),
                    "activity": safe_string_convert(row.get('activity', '')),
                    "rx_otc": safe_string_convert(row.get('rx_otc', '')),
                    "pregnancy_category": safe_string_convert(row.get('pregnancy_category', '')),
                    "csa": safe_string_convert(row.get('csa', '')),
                    "alcohol": safe_string_convert(row.get('alcohol', '')),
                    "rating": safe_float_convert(row.get('rating', 0)),
                }
                
                # Add these if they exist in your CSV
                if 'medical_condition' in df.columns:
                    drug_entry['medical_condition'] = safe_string_convert(row.get('medical_condition', ''))
                if 'side_effects' in df.columns:
                    drug_entry['side_effects'] = safe_string_convert(row.get('side_effects', ''))
                
                # Only add if generic_name is not empty
                if drug_entry['generic_name']:
                    drugs_data.append(drug_entry)
                
            except Exception as row_error:
                print(f"⚠️ Error processing row {index}: {row_error}")
                continue
        
        # Save to JSON file in frontend public folder
        output_path = '../public/drugs-database.json'
        
        print(f"💾 Saving {len(drugs_data)} drugs to JSON...")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(drugs_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully converted {len(drugs_data)} drugs to JSON")
        print(f"📁 Saved to: {output_path}")
        
        # Show sample entries
        if drugs_data:
            print(f"📊 Sample entry:")
            sample = drugs_data[0]
            for key, value in sample.items():
                print(f"   {key}: {value}")
        
        return True
        
    except FileNotFoundError:
        print("❌ Error: drugs_side_effects.csv not found in current directory")
        print("💡 Make sure you're running this from the python-api folder")
        return False
        
    except Exception as e:
        print(f"❌ Error converting CSV: {e}")
        print("💡 Trying with different column detection...")
        
        # Try to read just the first few rows to see structure
        try:
            df_sample = pd.read_csv('drugs_side_effects.csv', nrows=5)
            print(f"📋 Available columns: {list(df_sample.columns)}")
            print(f"📊 Sample data:")
            print(df_sample.head())
        except Exception as sample_error:
            print(f"❌ Could not read sample: {sample_error}")
        
        return False

if __name__ == "__main__":
    print("🚀 Starting CSV to JSON conversion...")
    success = convert_csv_to_json()
    if success:
        print("\n🎉 Conversion completed successfully!")
        print("📋 Next steps:")
        print("1. Check that public/drugs-database.json was created")
        print("2. Run your frontend: npm run dev")
        print("3. Test the Medicine Search page")
    else:
        print("\n❌ Conversion failed. Check the error messages above.")
