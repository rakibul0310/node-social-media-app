const AWS = require('aws-sdk');

const spacesEndpoint = new AWS.Endpoint(process.env.STORAGE_END_POINT);
const storage = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.STORAGE_ACCESS_KEY,
  secretAccessKey: process.env.STORAGE_SECRET_KEY,
});

module.exports = storage;
