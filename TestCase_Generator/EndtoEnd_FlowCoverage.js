const fs = require("fs");

// Read the eventMappings from the JSON file
const eventMappingsFilePath = 'Assets/EventMapping.json'; // Update the file path accordingly
const eventMappingsRaw = fs.readFileSync(eventMappingsFilePath, 'utf-8');
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

// Prepare the table structure for l_des
const formattedTable = tableData.map((item) => ({
  Destinations: item.Destination,
  Sources: item.Sources.split(", "),
}));

// Flatten the table structure
const table1 = [];
formattedTable.forEach(item => {
  if (Array.isArray(item.Sources)) {
    item.Sources.forEach(source => {
      table1.push({ Destinations: item.Destinations, Source: source });
    });
  } else {
    table1.push(item);
  }
});

// Table1 is created


// Define the file path to the rules JSON file
const rulesFilePath = "Assets/RuleEngine.json"; // Update the file path accordingly

// Read the rules from the JSON file
const rulesRaw = fs.readFileSync(rulesFilePath, "utf-8");
const rules = JSON.parse(rulesRaw);

// Initialize an array to store the transformed data
const table2 = rules.map((rule) => {
  // Extract the action type and parameters
  const actionType = Object.keys(rule.rule.actions[0])[0];
  const actionParams = rule.rule.actions[0][actionType];

  // Extract function name from functionArn if available
  const functionArn = actionParams && actionParams.functionArn;
  const functionName = functionArn ? functionArn.split(":function:")[1] : "";

  // Prepare additional parameters if they exist
  const additionalParams = actionParams[actionType] || {};

  // Create an object with relevant data
  return {
    Action: actionType,
    FunctionName: functionName,
    RuleName: rule.rule.ruleName,
    SQL: rule.rule.sql,
  };
});

// Table2 is created


// Function to find the SQL query and RuleName for a given source in table2
function findSQLAndRuleName(source) {
  const match = table2.find(item => item.Action === source || item.FunctionName === source);
  return match ? { SQLQuery: match.SQL, RuleName: match.RuleName } : { SQLQuery: 'N/A', RuleName: 'N/A' };
}

// Creating the new table with the matched SQL queries and RuleNames
const lambdaCoverage = table1.map((item, index) => {
  const { SQLQuery, RuleName } = findSQLAndRuleName(item.Source);
  return {
    Lambdas: item.Destinations,
    Service: item.Source,
    RuleName,
    SQLQuery
  };
});


// Regular expression to match the "publish" method calls
const publishRegex = /(\w+)\.publish/g;
const deviceData = require("./Assets/Device-Data.json");

// Iterate over devices
for (let deviceIndex = 1; deviceIndex <= 3; deviceIndex++) {
  const deviceFileName = `Assets/${deviceIndex}_device.Js`;

  // Read the device script content from the file
  const deviceScriptContent = fs.readFileSync(deviceFileName, "utf-8");

  // Set to store object names from "publish" calls
  const objectNamesFromPublish = new Set();
  let publishMatch;

  // Extract object names from "publish" calls
  while ((publishMatch = publishRegex.exec(deviceScriptContent)) !== null) {
    objectNamesFromPublish.add(publishMatch[1]);
  }

  // Extract the device name from the device script content
  const deviceNameMatch = deviceScriptContent.match(/const deviceName = '([^']+)'/);
  const deviceName = deviceNameMatch ? deviceNameMatch[1] : "";

  // Iterate over rows in the final table
  lambdaCoverage.forEach((row) => {
    const sqlFromMatch = row.SQLQuery.match(/FROM "([^"]+)"/);

    if (sqlFromMatch && sqlFromMatch[1]) {
      const topicName = sqlFromMatch[1];

      // Find the object name associated with the topic
      const associatedObjectName = [...objectNamesFromPublish].find((name) =>
        deviceScriptContent.includes(`${name}.publish("${topicName}"`)
      );

      if (associatedObjectName) {
        // Update the row with device name
        row["Device Name"] = deviceName;

        // Find the corresponding device data for the topic
        const matchingDeviceData = deviceData.find((data) =>
          data.topicFilter === topicName
        );

        if (matchingDeviceData) {
          // Extract variable names from the SQL query
          const variableNamesMatch = row.SQLQuery.match(/SELECT\s+([\w,\s]+)\s+FROM/i);

          if (variableNamesMatch) {
            const variableNames = variableNamesMatch[1].split(/\s*,\s*/);
            const payload = matchingDeviceData.messages[0].payload;

            // Create a params object with selected variables from payload
            const params = {};
            variableNames.forEach((paramName) => {
              if (paramName !== '*') {
                if (payload[paramName] !== undefined) {
                  params[paramName] = payload[paramName];
                }
              }
            });

            row["Topic"] = topicName;
            row["Params"] = params;
          } else {
            // Handle the case when no specific variables are selected
            row["Topic"] = topicName;

            // Create Params object from payload, excluding clientId
            const params = { ...matchingDeviceData.messages[0].payload };
            delete params.clientId;
            row["Params"] = params;
          }
        }
      }
    }
  });
}

// // l_des the updated final table
// console.table(lambdaCoverage);

const path = require("path");

const destinationMapping = {
  S3: "S3",
  DynamoDB: "DynamoDB",
  SNS: "SNS",
};

const l_des = [];

for (let fileNum = 1; fileNum <= 6; fileNum++) {
  const fileName = `file${fileNum}.js`;
  const filePath = path.join("Assets", fileName);
  const fileContent = fs.readFileSync(filePath, "utf-8").split("\n");

  let source = null;
  let destination = null;

  for (const line of fileContent) {
    const sourceMatch = line.match(/\/\/\s+Lambda\s+"([^"]+)"/);
    if (sourceMatch) {
      source = sourceMatch[1];
    } else if (line.includes("new AWS.")) {
      const match = line.match(/new\s+AWS\.(\w+)/);
      if (match) {
        const awsService = match[1];
        destination =
          destinationMapping[awsService] ||
          (awsService === "IotData" ? "Actuator" : "Unknown");
      }
      break;
    }
  }

  if (source && destination) {
    l_des.push({ Source: source, Destination: destination });
  }
}

// console.table(l_des);

// lambdaCoverage.forEach(item => {
//     const matchingRow = l_des.find(row => row.Source === item.Lambdas);
//     item.Destination = matchingRow ? matchingRow.Destination : "Unknown";
//   });
  
//   // Rearrange the columns in the lambdaCoverage table
//   const E2E_Coverage = lambdaCoverage.map(({ Destination, ...rest }) => ({
//     Destination,
//     ...rest
//   }));
  
//   // l_des the modified lambdaCoverage table with "Destination" at the start
//   console.table(E2E_Coverage);

lambdaCoverage.forEach((item) => {
  const matchingRow = l_des.find((row) => row.Source === item.Lambdas);
  item.Destination = matchingRow ? matchingRow.Destination : "Unknown";
});

// Rearrange the columns in the lambdaCoverage table
const E2E_Coverage = lambdaCoverage.map(({ Destination, ...rest }) => ({
  Destination,
  ...rest,
}));

// l_des the modified lambdaCoverage table with "Destination" at the start
// console.table(E2E_Coverage);

// Read the BridgeMappings from the JSON file
const BridgeMappings_Path = "Assets/EventBridge_RuleMapping.json"; // Update the file path accordingly

const BridgeMappingsRaw = fs.readFileSync(BridgeMappings_Path, "utf-8");
const BridgeMappings = JSON.parse(BridgeMappingsRaw);

const allRuleInfo = [];

for (const jsonData of BridgeMappings) {
  const ruleInfo = [];

  for (const target of jsonData.Targets) {
    const arn = target.Arn;
    let destinationType = "Unknown";

    if (arn.startsWith("arn:aws:sns")) {
      destinationType = "SNS";
    } else if (arn.startsWith("arn:aws:s3")) {
      destinationType = "S3";
    } else if (arn.startsWith("arn:aws:dynamodb")) {
      destinationType = "DynamoDB";
    } else if (arn.startsWith("arn:aws:iot")) {
      destinationType = "Actuator";
    }

    ruleInfo.push({
      Source: jsonData.EventPattern.source[0].split(".")[1],
      ARN: arn,
      Destination: destinationType,
    });
  }

  allRuleInfo.push(...ruleInfo);
}

// Add 'Destination Path' column to E2E_Coverage and populate it based on conditions
const updatedE2E_Coverage = E2E_Coverage.map((item) => {
  const lowerDestination = item.Destination.toLowerCase();

  if (lowerDestination === "actuator" || lowerDestination === "sns") {
    return { ...item, "Destination Path": "" };
  } else {
    return { ...item, "Destination Path": "SNS (Actuator)"}
  }
});

// Add the 'Destination Path' column to the start of each item in the updatedE2E_Coverage
const updatedE2E_CoverageWithColumn = updatedE2E_Coverage.map((item) => {
  return { "Destination Path": item["Destination Path"], ...item };
});

// Print the updated E2E_Coverage table with the added column at the start
console.table(updatedE2E_CoverageWithColumn);
// Console.log to print all the actual attribute value pairs instead of object.


