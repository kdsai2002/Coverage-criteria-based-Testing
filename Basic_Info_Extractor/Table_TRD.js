const fs = require("fs");

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

// Display the transformed data in a table
console.table(table2);
