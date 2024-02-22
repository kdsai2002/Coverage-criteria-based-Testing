// Publish Data from car devices - iot.js

const awsIoT = require('aws-iot-device-sdk');

// Require crypto for random numbers generation
const crypto = require('crypto');

// Load the endpoint from file
//const endpointFile = "a3jb9ni9xg51t6-ats.iot.us-east-1.amazonaws.com"

// Fetch the deviceName from the folder name
const deviceName = 'Device2';

// Create the thingShadow object with argument data
const device = awsIoT.device({
   keyPath: 'mycar-private.pem.key',
  certPath: 'mycar-certificate.pem.crt',
    caPath: '/home/ec2-user/environment/root-CA.crt',
  clientId: deviceName,
      host: "a3jb9ni9xg51t6-ats.iot.us-east-1.amazonaws.com"
});

// Function that gets executed when the connection to IoT is established
device.on('connect', function() {
    console.log('Connected to AWS IoT');
    
    // Start the publish loop
    infiniteLoopPublish();
});

// Function sending car telemetry data every 5 seconds
function infiniteLoopPublish() {
    console.log('Sending car telemetry data to AWS IoT for ' + deviceName);
    // Publish car data to edx/telemetry topic with getCarData
    device.publish("T2", JSON.stringify(getCarData(deviceName)));
    
    // Start Infinite Loop of Publish every 10 seconds
    setTimeout(infiniteLoopPublish, 10000);
}

// Function to create a random float between minValue and maxValue
function randomFloatBetween(minValue,maxValue){
    return parseFloat(Math.min(minValue + (Math.random() * (maxValue - minValue)),maxValue));
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// Generate random car data based on the deviceName
function getCarData(deviceName) {
    let message = {
        
  "clientId": "ID-91B2F06B3H91",
    "A11":  randomFloatBetween(200,800) 
 };
    
    return message;
}