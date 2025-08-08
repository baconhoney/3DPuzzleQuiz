const fs = require("fs");
const https = require("https");
const path = require("path");

const url =
    "https://raw.githubusercontent.com/baconhoney/3DPuzzleQuiz/refs/heads/main/Server/masterdata/masterList.json";

const jsonOutputPath = "./scripts/masterList.json";

https
    .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
            try {
                const json = JSON.parse(data);
                fs.writeFileSync(jsonOutputPath, JSON.stringify(json, null, 4));
                console.log("✅ masterList.json generated.");
            } catch (e) {
                console.error("❌ Failed to parse JSON:", e);
            }
        });
    })
    .on("error", (err) => {
        console.error("❌ Failed to fetch JSON:", err);
    });
