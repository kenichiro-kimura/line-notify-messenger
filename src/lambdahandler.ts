import { S3ImageStorage } from './s3ImageStorage';
import { JimpImageConverter } from './jimpImageConverter';
import { LambdaLineNotifyMessenger } from './lambdaLineNotifyMessenger';
import { LineNotifyMessengerApp } from './lineNotifyMessengerApp';

const multipart = require('aws-lambda-multipart-parser');

export const handler = async (event: any) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const messenger = new LambdaLineNotifyMessenger(event);

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        return messenger.httpInternalServerErrorMessage('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const bucketName = process.env.BUCKET_NAME;
    const s3Region = process.env.S3_REGION;

    if (!bucketName || !s3Region) {
        return messenger.httpInternalServerErrorMessage('BUCKET_NAME or S3_REGION is not set');
    }

    const app = new LineNotifyMessengerApp(messenger, lineChannelAccessToken, new S3ImageStorage(bucketName, s3Region), new JimpImageConverter());

    return await app.processRequest();
};
