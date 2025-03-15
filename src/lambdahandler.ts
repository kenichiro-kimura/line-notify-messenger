/* eslint-disable  @typescript-eslint/no-explicit-any */
import { S3ImageStorage } from './s3ImageStorage';
import { JimpImageConverter } from './jimpImageConverter';
import { LambdaLineNotifyMessenger } from './lambdaLineNotifyMessenger';
import { LineNotifyMessengerApp } from './lineNotifyMessengerApp';
import { LambdaHttpResponse } from './interfaces/lineNotifyMessenger';
import { IGroupRepository } from './interfaces/groupRepository';

export const handler = async (event: any): Promise<LambdaHttpResponse> => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const messenger = new LambdaLineNotifyMessenger(event);
    const groupRepository: IGroupRepository = {} as IGroupRepository;

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const bucketName = process.env.BUCKET_NAME;
    const s3Region = process.env.S3_REGION;

    if (!bucketName || !s3Region) {
        throw new Error('BUCKET_NAME or S3_REGION is not set');
    }

    const app = new LineNotifyMessengerApp(messenger, lineChannelAccessToken, new S3ImageStorage(bucketName, s3Region), new JimpImageConverter(), groupRepository);

    return await app.processRequest() as LambdaHttpResponse;
};
