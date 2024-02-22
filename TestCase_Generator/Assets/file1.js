// Lambda "L5" to DynamoDB

const AWS = require("aws-sdk");
const dynamodbClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context, callback) => {
  AWS.config.update({
    region: "us-west-1",
  });

  let params = {
    TableName: "S3BucketImages",
    Item: {
      UniqueKey: new Date().toString(),
    },
  };

  await dynamodbClient
    .put(params)
    .promise()
    .then((data) => {
      console.info("successfully update to dynamodb", data);
    })
    .catch((err) => {
      console.info("failed adding data dynamodb", err);
    });
};
