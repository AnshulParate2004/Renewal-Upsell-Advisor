import pandas as pd
import sys

excel_file = "D:/Renewal-Upsell-Advisor/Backend/supabase_full_export.xlsx"

try:
    xl = pd.ExcelFile(excel_file)
    print("Sheets found:", xl.sheet_names)
    for sheet in xl.sheet_names:
        df = xl.parse(sheet, nrows=5)
        print(f"\n--- Sheet: {sheet} ---")
        print("Columns:", df.columns.tolist())
except Exception as e:
    print("Error:", e)
