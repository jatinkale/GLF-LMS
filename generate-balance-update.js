const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, 'Feature Development', 'Employee Leave Balance - November 2025.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('Excel file loaded. Total rows:', data.length);
console.log('Sample row:', data[0]);

// Generate SQL script
let sqlScript = `-- Leave Balance Update Script for November 2025
-- Generated on: ${new Date().toISOString()}
-- This script updates leave balances for employees based on the Excel file

-- Start transaction
START TRANSACTION;

`;

// Track statistics
let updateCount = 0;
let errors = [];

// Process each row
data.forEach((row, index) => {
  try {
    const employeeId = row['Emp ID'] || row['Employee ID'] || row['EmployeeID'] || row['ID'];
    const name = row['Emp Name'] || row['Name'] || row['Employee Name'];
    const plBalance = parseFloat(row['PL'] || row['Privilege Leave'] || 0);
    const clBalance = parseFloat(row['CL'] || row['Casual Leave'] || 0);

    if (!employeeId) {
      errors.push(`Row ${index + 2}: Missing Employee ID`);
      return;
    }

    // Keep employee ID exactly as it appears in Excel (preserve spaces)
    const cleanEmployeeId = String(employeeId).trim();

    sqlScript += `-- Update for Employee: ${name} (${cleanEmployeeId})\n`;

    // Update PL (Privilege Leave) if provided (including 0 values)
    if (!isNaN(plBalance) && plBalance >= 0) {
      sqlScript += `UPDATE leave_balances
SET allocated = ${plBalance},
    available = ${plBalance},
    used = 0,
    pending = 0
WHERE employeeId = '${cleanEmployeeId}'
  AND leaveTypeCode = 'PL'
  AND year = 2025;

`;
      updateCount++;
    }

    // Update CL (Casual Leave) if provided (including 0 values)
    if (!isNaN(clBalance) && clBalance >= 0) {
      sqlScript += `UPDATE leave_balances
SET allocated = ${clBalance},
    available = ${clBalance},
    used = 0,
    pending = 0
WHERE employeeId = '${cleanEmployeeId}'
  AND leaveTypeCode = 'CL'
  AND year = 2025;

`;
      updateCount++;
    }

    sqlScript += '\n';
  } catch (error) {
    errors.push(`Row ${index + 2}: ${error.message}`);
  }
});

sqlScript += `
-- Commit transaction
COMMIT;

-- Summary:
-- Total updates: ${updateCount}
-- Date: ${new Date().toISOString()}
`;

// Write SQL script to file
const outputPath = path.join(__dirname, 'Nov2025 Leave Balance Update.sql');
fs.writeFileSync(outputPath, sqlScript, 'utf8');

console.log('\n=== SQL Script Generated ===');
console.log('Output file:', outputPath);
console.log('Total updates:', updateCount);
console.log('Rows processed:', data.length);

if (errors.length > 0) {
  console.log('\n=== Errors ===');
  errors.forEach(err => console.log(err));
}

console.log('\n=== Sample SQL ===');
console.log(sqlScript.substring(0, 1000) + '...');
