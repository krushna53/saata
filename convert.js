const XLSX = require('xlsx');
const fs = require('fs');

// 📂 Load your Excel file
const workbook = XLSX.readFile('SAJTAMaster.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 🔁 Read raw data (array format)
const rawData = XLSX.utils.sheet_to_json(worksheet, {
  header: 1,
  defval: "",
});

// 🧠 Find correct header row (adjust if needed)
const headers = rawData[0]; // or 1 or 2 based on your file

// 🔄 Convert to clean JSON
const jsonData = rawData.slice(1).map((row) => {
  const obj = {};
  headers.forEach((key, index) => {
    if (key) obj[key.trim()] = row[index];
  });
  return obj;
});

// 🧹 Remove empty rows
const cleanData = jsonData.filter(item =>
  Object.values(item).some(val => val !== "")
);

// 💾 Save JSON
fs.writeFileSync('sajta.json', JSON.stringify(cleanData, null, 2));

console.log("✅ JSON created successfully!");