const xlsx = require('xlsx');
const fs = require('fs');

const files = [
  "Present List of Children at Kupwara home.xlsx",
  "Present List of Staff at Anantnag Home Home.xlsx",
  "Present List of Staff at Kupwara Home.xlsx",
  "Staff-list.xlsx",
  "Studentslistapril2026.xlsx",
  "present list of Anantnag students.xlsx",
  "present staff list Beerwah home.xlsx",
  "present student list of Beerwah home.xlsx"
];

for (const file of files) {
  try {
    const filePath = `d:/BWF/BWF/${file}`;
    if (!fs.existsSync(filePath)) continue;
    
    console.log(`\n--- Reading ${file} ---`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Print first two rows (headers and one data row)
    console.log('Row 1 (Headers):', data[0]);
    console.log('Row 2 (Data):', data[1] || 'No data row');
    console.log(`Total rows: ${data.length}`);
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}
