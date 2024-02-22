// Lambda "L6" to Actuator

const AWS = require("aws-sdk");
const iotdata = new AWS.IotData({
  endpoint: "my-end-point.iot.eu-west-1.amazonaws.com",
});

exports.handler = async (event, context) => {
  try {
    const params = {
      topic: "$aws/things/Edison_Seba/shadow/update",
      payload: JSON.stringify({
        state: { desired: { windowOpen: true, posto2: true } },
      }),
      qos: 0,
    };

    const publishResult = await iotdata.publish(params).promise();
    console.log("Message published:", publishResult);

    return {
      statusCode: 200,
      body: JSON.stringify("Message published successfully."),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Error publishing the message."),
    };
  }
};
