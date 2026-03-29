import fs from 'fs';
import xlsx from 'xlsx';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node xlsx_to_json.mjs <input.xlsx> <output.json>');
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1];
const simpleOutputPath = outputPath.replace(/\.json$/, '_simple.json');

try {
  console.log(`Reading ${inputPath}...`);
  const workbook = xlsx.readFile(inputPath);
  
  const sheetNameList = workbook.SheetNames;
  if (sheetNameList.length === 0) {
    console.error('No sheets found in the workbook.');
    process.exit(1);
  }
  
  const firstSheetName = sheetNameList[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  console.log(`Converting sheet "${firstSheetName}" to JSON...`);
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: null });
  
  console.log(`Writing full version to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  
  console.log(`Generating simplified version with overview truncated to 300 chars...`);
  const simpleData = jsonData.map(item => {
    const newItem = { ...item };
    if (newItem.overview && typeof newItem.overview === 'string') {
      if (newItem.overview.length > 300) {
        newItem.overview = newItem.overview.substring(0, 300) + '...';
      }
    }
    return newItem;
  });
  
  console.log(`Writing simplified version to ${simpleOutputPath}...`);
  fs.writeFileSync(simpleOutputPath, JSON.stringify(simpleData, null, 2), 'utf-8');
  
  console.log(`Successfully converted. Total rows: ${jsonData.length}`);
} catch (error) {
  console.error('Error during conversion:', error.message);
  process.exit(1);
}
