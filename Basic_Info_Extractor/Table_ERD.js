const fs = require('fs');

// Read the eventMappings from the JSON file
const eventMappingsFilePath = 'Assets/EventBridge_RuleMapping.json'; // Update the file path accordingly

try {
  const eventMappingsRaw = fs.readFileSync(eventMappingsFilePath, 'utf-8');
  const eventMappings = JSON.parse(eventMappingsRaw);

  const allRuleInfo = [];

  for (const jsonData of eventMappings) {
    const ruleInfo = [];

    for (const target of jsonData.Targets) {
      const arn = target.Arn;
      let destinationType = 'Unknown';

      if (arn.startsWith('arn:aws:sns')) {
        destinationType = 'SNS';
      } else if (arn.startsWith('arn:aws:s3')) {
        destinationType = 'S3';
      } else if (arn.startsWith('arn:aws:dynamodb')) {
        destinationType = 'DynamoDB';
      } else if (arn.startsWith('arn:aws:iot')) {
        destinationType = 'Actuator';
      }

      ruleInfo.push({
        Source: jsonData.EventPattern.source[0].split('.')[1],
        ARN: arn,
        Destination: destinationType,
      });
    }

    allRuleInfo.push(...ruleInfo);
  }

  console.table(allRuleInfo);
} catch (error) {
  console.error('Error reading or parsing JSON file:', error);
}
