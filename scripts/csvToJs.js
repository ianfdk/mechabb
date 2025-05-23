const fs = require('fs');
const path = require('path');

function parseCSV(content) {
  const lines = content.split('\n').filter((line) => line.trim());
  const headers = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {});
  });
}

function convertCsvToJs() {
  // Define input and output file paths
  const inputFile = path.join('data', 'units.csv');
  const outputFile = path.join('docs', 'data', 'units.js');

  // Read and parse the CSV file
  const fileContent = fs.readFileSync(inputFile, 'utf-8');
  const records = parseCSV(fileContent);

  // Convert the records to a dictionary keyed by name
  const data = records.reduce((acc, row) => {
    // Convert values to appropriate types
    const processedRow = Object.entries(row).reduce((obj, [key, value]) => {
      if (value.toLowerCase() === 'true') {
        obj[key] = true;
      } else if (value.toLowerCase() === 'false') {
        obj[key] = false;
      } else if (value === '') {
        obj[key] = null;
      } else if (!isNaN(value)) {
        obj[key] = Number(value);
      } else {
        obj[key] = value;
      }
      return obj;
    }, {});

    acc[row.name] = processedRow;
    return acc;
  }, {});

  // Write to JS file as a module
  const jsContent =
    '// This file is auto-generated from units.csv\n' +
    `export const units =  ${JSON.stringify(data, null, 2)};`;
  fs.writeFileSync(outputFile, jsContent);
}

convertCsvToJs();
