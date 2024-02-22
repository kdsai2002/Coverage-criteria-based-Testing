// Lambda "L1" to SNS

const AWS = require("aws-sdk");
const sns = new AWS.SNS();

const params = {
  Message: process.env.SNS_MESSAGE,
  MessageAttributes: {
    MsgAttrName: {
      DataType: "String",
      StringValue: "String",
    },
  },
  TopicArn: process.env.SNS_TOPIC_ARN, // put topic name here!
};

exports.handler = () => {
  sns.publish(params, (err) => {
    if (err)
      console.log(
        "FAILED!!!!!!    ERROR IS: ",
        err,
        err.stack
      ); // error occured
    else console.log("SUCCESSFUL!!!!!    "); //successful response
  });
};
