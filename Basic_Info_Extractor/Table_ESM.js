const fs = require("fs");

// Read the eventMappings from the JSON file
const eventMappingsFilePath = "Assets/EventMapping.json"; // Update the file path accordingly
const eventMappingsRaw = fs.readFileSync(eventMappingsFilePath, "utf-8");
const eventMappings = JSON.parse(eventMappingsRaw);

// Function to determine the source name based on EventSourceArn
function getSourceName(eventSourceArn, numLambdas) {
  if (eventSourceArn.includes("sns")) {
    return "sns";
  } else if (eventSourceArn.includes("s3")) {
    return "s3";
  } else if (eventSourceArn.includes("dynamodb")) {
    return "dynamoDB";
  } else if (eventSourceArn.includes("iot")) {
    return "iotEvent";
  } else if (eventSourceArn.includes("sqs")) {
    return "sqs";
  } else {
    const lambdaIndex = eventSourceArn.match(/\d+$/);
    if (lambdaIndex && parseInt(lambdaIndex[0]) <= numLambdas) {
      return `L${lambdaIndex[0]}`;
    } else {
      return "Http";
    }
  }
}

// Function to create a table of destination sources
function createDestinationSourcesTable(eventMappings, numLambdas) {
  const destSourcesMap = new Map();

  eventMappings.forEach((mapping) => {
    const source = getSourceName(mapping.EventSourceArn, numLambdas);
    const destination = mapping.FunctionArn.split(":").pop();

    if (destSourcesMap.has(destination)) {
      const sources = destSourcesMap.get(destination);
      sources.push(source);
    } else {
      destSourcesMap.set(destination, [source]);
    }
  });

  // Add the missing lambdas with "Http" as the source
  for (let i = 1; i <= numLambdas; i++) {
    const lambdaName = `L${i}`;
    if (!destSourcesMap.has(lambdaName)) {
      destSourcesMap.set(lambdaName, ["Http"]);
    }
  }

  return Array.from(destSourcesMap.entries()).map(([destination, sources]) => ({
    Destination: destination,
    Sources: sources.join(", "),
  }));
}

// Example input for the number of lambdas (replace with actual number)
const numLambdas = 6;

// Create the table data with destinations and sources
const tableData = createDestinationSourcesTable(eventMappings, numLambdas);

// Prepare the table structure for output
const formattedTable = tableData.map((item) => ({
  Destinations: item.Destination,
  Sources: item.Sources.split(", "),
}));

// Flatten the table structure
const flattenedTable = [];
formattedTable.forEach((item) => {
  if (Array.isArray(item.Sources)) {
    item.Sources.forEach((source) => {
      flattenedTable.push({ Destinations: item.Destinations, Source: source });
    });
  } else {
    flattenedTable.push(item);
  }
});

// Print the final table
console.table(flattenedTable);
