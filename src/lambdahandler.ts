/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { S3ImageStorage } from '@repositories/s3ImageStorage';
import { JimpImageConverter } from '@utils/jimpImageConverter';
import { LambdaLineNotifyMessenger } from '@core/lambdaLineNotifyMessenger';
import { LineNotifyMessengerApp } from '@core/lineNotifyMessengerApp';
import { LambdaHttpResponse } from '@interfaces/lineNotifyMessenger';
import { DynamoGroupRepository } from '@repositories/dynamoGroupRepository';
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';
import { IGroupRepository } from '@interfaces/groupRepository';
import { ILineNotifyMessenger } from '@interfaces/lineNotifyMessenger';
import { ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { EnvironmentSendModeStrategy } from '@strategies/sendModeStrategy';
import LineService from '@services/lineService';

export const handler = async (event: any): Promise<LambdaHttpResponse> => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const bucketName = process.env.BUCKET_NAME;
    const s3Region = process.env.S3_REGION;

    if (!bucketName || !s3Region) {
        throw new Error('BUCKET_NAME or S3_REGION is not set');
    }

    const tableName = process.env.TABLE_NAME;
    const dynamoRegion = process.env.DYNAMO_REGION;

    if (!tableName || !dynamoRegion) {
        throw new Error('TABLE_NAME or DYNAMO_REGION is not set');
    }

    // Tsyringeで依存関係を登録
    container.registerInstance('LineChannelAccessToken', lineChannelAccessToken);
    container.registerInstance<IImageStorage>('IImageStorage', new S3ImageStorage(bucketName, s3Region));
    container.register<IImageConverter>('IImageConverter', JimpImageConverter);
    container.registerInstance<IGroupRepository>('IGroupRepository', new DynamoGroupRepository(tableName, dynamoRegion));
    container.registerInstance<ILineNotifyMessenger>('ILineNotifyMessenger', new LambdaLineNotifyMessenger(event));
    container.register<ISendModeStrategy>('ISendModeStrategy', { useClass: EnvironmentSendModeStrategy });
    container.register('LineService', { useClass: LineService });
    
    // TsyringeでLineNotifyMessengerAppを解決
    const app = container.resolve(LineNotifyMessengerApp);

    return await app.processRequest() as LambdaHttpResponse;
};
