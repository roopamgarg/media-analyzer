import AWS from 'aws-sdk';
import { config } from './config';

const s3 = new AWS.S3({
  region: config.AWS_REGION,
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
});

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export async function uploadToS3(
  key: string,
  body: Buffer | string,
  contentType: string,
  bucket: string = config.S3_BUCKET
): Promise<UploadResult> {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  const result = await s3.upload(params).promise();
  
  return {
    url: result.Location,
    key: result.Key,
    bucket: result.Bucket,
  };
}

export function getPresignedUrl(
  key: string,
  expiresIn: number = 900, // 15 minutes
  bucket: string = config.S3_BUCKET
): string {
  return s3.getSignedUrl('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
  });
}

export async function deleteFromS3(
  key: string,
  bucket: string = config.S3_BUCKET
): Promise<void> {
  await s3.deleteObject({
    Bucket: bucket,
    Key: key,
  }).promise();
}
