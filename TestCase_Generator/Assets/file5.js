// Lambda "L4" to S3

const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    // Assuming the input event contains the necessary information about the file and its content
    const { fileName, fileContent, bucketName } = event;

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileContent,
    };

    await s3.upload(params).promise();
    console.log("File uploaded successfully.");

    return {
      statusCode: 200,
      body: JSON.stringify("File uploaded successfully."),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Error uploading the file."),
    };
  }
};
