const fs = require('fs');
let content = fs.readFileSync('teacher/controllers/tasks.js', 'utf8');
content = content.replace(/return res\.status\(500\)\.json\(\{ message: "Server error" \}\);/g, "return res.status(500).json({ message: error.message, stack: error.stack });");
fs.writeFileSync('teacher/controllers/tasks.js', content);
console.log('Fixed tasks errors');
