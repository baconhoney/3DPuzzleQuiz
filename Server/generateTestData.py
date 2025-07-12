import random
import json, copy, datetime
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
    sampled_data.rename(columns={"Név": "name", "Ország": "country", "Város": "city"})
    sampled_data["number"] = [random.randint(1, 100) for _ in range(num_rows_per_test)]
    sampled_data["correct"] = [random.random() > 0.5 for _ in range(num_rows_per_test)]
    sampled_data["id"] = [random.randint(2000, 9999) for _ in range(num_rows_per_test)]
    sampled_data = sampled_data.to_dict(orient="records")
    test_sheets.append({
        "testData": copy.deepcopy(sampled_data),
        "score": sum(int(c["correct"]) for c in sampled_data),
        "timestamp": (datetime.datetime.now() - datetime.timedelta(microseconds=(random.random() * 600 * 1e6))).isoformat(timespec="milliseconds")
        })

# Save to JSON file
output_path = "test_sheets.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(test_sheets, f, ensure_ascii=False, indent=4)

