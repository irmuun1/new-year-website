const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const inputFile = 'Name table.csv'; // Input file name
const outputFile = 'associations.csv'; // Output file name

const males = [];
const females = [];

// Read input CSV
fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    if (row.gender === 'm') {
      males.push(row);
    } else if (row.gender === 'f') {
      females.push(row);
    }
  })
  .on('end', () => {
    if (males.length === 0 || females.length === 0) {
      console.error("Error: Insufficient participants of opposite genders.");
      return;
    }

    // Shuffle an array
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    // Shuffle participants
    shuffle(males);
    shuffle(females);

    const pairs = [];

    // Create pairs
    for (let i = 0; i < Math.min(males.length, females.length); i++) {
      pairs.push({
        email: males[i].email,
        name: males[i].name,
        gender: 'm',
        assignedEmail: females[i].email,
        assignedName: females[i].name,
        assignedGender: 'f',
      });
      pairs.push({
        email: females[i].email,
        name: females[i].name,
        gender: 'f',
        assignedEmail: males[i].email,
        assignedName: males[i].name,
        assignedGender: 'm',
      });
    }

    // Write to output CSV
    const csvWriter = createObjectCsvWriter({
      path: outputFile,
      header: [
        { id: 'email', title: 'email' },
        { id: 'assignedName', title: 'name' },
      ],
    });

    csvWriter.writeRecords(pairs)
      .then(() => {
        console.log(`Assignments written to ${outputFile}`);
      })
      .catch(err => {
        console.error("Error writing to output file:", err);
      });
  })
  .on('error', (err) => {
    console.error("Error reading input file:", err);
  });
