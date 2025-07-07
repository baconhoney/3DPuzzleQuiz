import random
import json
import pandas as pd

# Recreate the previous setup since tool access was reset
file_path = "Teszt/Mesterlista.xlsx"
df = pd.read_excel(file_path, sheet_name="Lista")

# Only keep relevant columns
columns = ["Név", "Ország", "Város"]
data = df[columns]

# Parameters
num_tests = random.randint(20, 25)
num_rows_per_test = 20

# Generate test sheets (allow duplicates across tests)
test_sheets = []
for _ in range(num_tests):
    sampled_data = data.sample(n=num_rows_per_test, replace=False).copy()
    sampled_data["Szám"] = [random.randint(1, 100) for _ in range(num_rows_per_test)]
    test_sheets.append(sampled_data.to_dict(orient="records"))

# Save to JSON file
output_path = "test_sheets.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(test_sheets, f, ensure_ascii=False, indent=4)

