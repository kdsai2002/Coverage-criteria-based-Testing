const fs = require("fs");
const deviceData = require("./Assets/Device-Data.json");

// Create an array to store the final results
const finalTable = [];

// Regular expression to match the object before .publish() method call
const publishRegex = /(\w+)\.publish/g;

// Iterate through the three device files
for (let i = 1; i <= 3; i++) {
  const deviceFileName = `Assets/${i}_device.Js`;

  // Read the content of the current device file
  const deviceScriptContent = fs.readFileSync(deviceFileName, "utf-8");

  // Extract deviceName from device.js content
  const deviceNameMatch = deviceScriptContent.match(
    /const deviceName = '([^']+)'/);
  const deviceName = deviceNameMatch ? deviceNameMatch[1] : "";

  // Extract object names from device.js content and create a Set
  const objectNames = new Set();
  let match;
  while ((match = publishRegex.exec(deviceScriptContent)) !== null) {
    objectNames.add(match[1]);
  }

  // Match topic names from the Device-Data.json and device.js
  deviceData.forEach((data) => {
    const topicName = data.topicFilter;

    // Check if any object name from the Set is in device.js content
    const objectName = [...objectNames].find((name) =>
      deviceScriptContent.includes(`${name}.publish("${topicName}"`)
    );

    if (objectName) {
      const matchingDeviceData = deviceData.find((data) =>
        data.topicFilter === topicName
      );

      if (matchingDeviceData) {
        // Create Params object from payload, excluding clientId
        const params = { ...matchingDeviceData.messages[0].payload };
        delete params.clientId;

        // Create a row for the final table
        const row = {
          "Device Name": deviceName,
          "Topic Name": topicName,
          "Params": params
        };

        finalTable.push(row);
      }
    }
  });
}

// Display the combined data in a table format
console.table(finalTable);
// Console.log to print all the actual attribute value pairs instead of object.
