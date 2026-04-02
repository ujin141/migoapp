import fs from 'fs';
const data = JSON.parse(fs.readFileSync('extracted_babel.json', 'utf8'));
const keys = Object.keys(data);
console.log(`Total keys: ${keys.length}`);
console.log('Sample 5 entries:');
for (let i = 0; i < 5; i++) {
  console.log(`${keys[i]}: ${data[keys[i]]}`);
}

const recovered = JSON.parse(fs.readFileSync('recovered.json', 'utf8'));
const recKeys = Object.keys(recovered);
console.log(`\nRecovered Total keys: ${recKeys.length}`);
console.log('Sample 5 entries:');
for (let i = 0; i < 5; i++) {
  console.log(`${recKeys[i]}: ${recovered[recKeys[i]]}`);
}
