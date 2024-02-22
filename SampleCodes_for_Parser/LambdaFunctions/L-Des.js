const fs = require("fs");
const path = require("path");
const readline = require("readline");

const destinationMapping = {
  S3: "S3",
  DynamoDB: "DynamoDB",
  SNS: "SNS",
};

function extractDestination(line) {
  const match = line.match(/new\s+AWS\.(\w+)/);
  if (match) {
    const awsService = match[1];
    return (
      destinationMapping[awsService] ||
      (awsService === "IotData" ? "Actuator" : "Unknown")
    );
  }
  return null;
}

async function processFile(fileName) {
  const filePath = path.join("Assets", fileName);
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let source = null;
  let destination = null;

  for await (const line of rl) {
    const sourceMatch = line.match(/\/\/\s+Lambda\s+"([^"]+)"/);
    if (sourceMatch) {
      source = sourceMatch[1];
    } else if (line.includes("new AWS.")) {
      destination = extractDestination(line);
      break;
    }
  }

  if (source && destination) {
    return { Source: source, Destination: destination };
  } else {
    return null;
  }
}

async function generateTable() {
  const output = [];

  for (let fileNum = 1; fileNum <= 6; fileNum++) {
    const fileName = `file${fileNum}.js`;
    const result = await processFile(fileName);
    if (result) {
      output.push(result);
    }
  }

  console.table(output);
}

generateTable();
