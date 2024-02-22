// Lambda "L2" to Actuator

var AWS = require("aws-sdk");
var iotdata = new AWS.IotData({
  endpoint: "my-end-point.iot.eu-west-1.amazonaws.com",
});

exports.handler = function (event, context) {
  var params = {
    topic: "$aws/things/Edison_Seba/shadow/update",
    payload:
      new Buffer("60") ||
      '{"state": {"desired": {"windowOpen": true,"posto2": true}}}',
    qos: 0,
  };
  iotdata.publish(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
  });
};
