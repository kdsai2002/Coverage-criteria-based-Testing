// Lambda "L3" to Actuator

var AWS = require("aws-sdk");

var iotdata = new AWS.IotData({
  endpoint: "yourendpoint.iot.eu-central-1.amazonaws.com",
});

exports.handler = function (event, context, callback) {
  console.log("found iotdata", iotdata);

  var params = {
    topic: "topic/test",
    payload: "blah",
    qos: 0,
  };

  iotdata.publish(params, function (err, data) {
    if (err) {
      console.log("Error occured : ", err);
    } else {
      console.log("success.....");
    }
  });

  callback();
};
