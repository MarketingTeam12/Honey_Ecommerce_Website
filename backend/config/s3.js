const { S3Client } = require("@aws-sdk/client-s3");

const s3Region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;

const isS3Configured = () => {
  return Boolean(
    s3Region &&
    bucketName &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
};

const s3Client = new S3Client({
  region: s3Region || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

function getBucketName() {
  if (!bucketName) {
    throw new Error("AWS S3 bucket name is not configured");
  }
  return bucketName;
}

module.exports = {
  s3Client,
  getBucketName,
  isS3Configured,
};
