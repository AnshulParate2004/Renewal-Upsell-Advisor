import pandas as pd
import json

excel_file = "D:/Renewal-Upsell-Advisor/Backend/supabase_full_export.xlsx"
xl = pd.ExcelFile(excel_file)
schema = {}
for sheet in xl.sheet_names:
    df = xl.parse(sheet, nrows=1)
    schema[sheet] = df.columns.tolist()

with open("D:/Renewal-Upsell-Advisor/Backend/excel_schema.json", "w") as f:
    json.dump(schema, f, indent=2)
