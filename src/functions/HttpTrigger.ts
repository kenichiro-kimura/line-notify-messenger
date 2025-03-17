import 'reflect-metadata';
import { container } from 'tsyringe';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobImageStorage } from "@repositories/blobImageStorage";
import { JimpImageConverter } from "@utils/jimpImageConverter";
import { FunctionsLineNotifyMessenger } from "@core/functionsLineNotifyMessenger";
import { LineNotifyMessengerApp } from "@core/lineNotifyMessengerApp";
import { FunctionsHttpResponse } from "@interfaces/lineNotifyMessenger";
import { TableStorageGroupRepository } from "@repositories/tableStorageGroupRepository";
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';
import { IGroupRepository } from '@interfaces/groupRepository';
import { ILineNotifyMessenger } from '@interfaces/lineNotifyMessenger';
import { ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { EnvironmentSendModeStrategy } from '@strategies/sendModeStrategy';
import LineService from '@services/lineService';

export async function HttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Received request:', request);

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const blobName = process.env.BLOB_NAME;
    const blobConnectionString = process.env.BLOB_CONNECTION_STRING;

    if (!blobName || !blobConnectionString) {
        throw new Error('BLOB_NAME or BLOB_CONNECTION_STRING is not set');
    }

    const tableName = process.env.TABLE_NAME;
    const tableConnectionString = process.env.TABLE_CONNECTION_STRING;

    if (!tableName || !tableConnectionString) {
        throw new Error('TABLE_NAME or TABLE_CONNECTION_STRING is not set');
    }

    // Tsyringeで依存関係を登録
    container.registerInstance('LineChannelAccessToken', lineChannelAccessToken);
    container.registerInstance<IImageStorage>('IImageStorage', new BlobImageStorage(blobConnectionString, blobName));
    container.register<IImageConverter>('IImageConverter', JimpImageConverter);
    container.registerInstance<IGroupRepository>('IGroupRepository', new TableStorageGroupRepository(tableConnectionString, tableName));
    container.registerInstance<ILineNotifyMessenger>('ILineNotifyMessenger', new FunctionsLineNotifyMessenger(request));
    container.register<ISendModeStrategy>('ISendModeStrategy', { useClass: EnvironmentSendModeStrategy });
    container.register('LineService', { useClass: LineService });

    // TsyringeでLineNotifyMessengerAppを解決
    const app = container.resolve(LineNotifyMessengerApp);

    return await app.processRequest() as FunctionsHttpResponse;
}

app.http('HttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: HttpTrigger
});
app.http('HttpTriggerNotify', {
    methods: ['GET', 'POST'],
    route: 'HttpTrigger/notify',
    authLevel: 'anonymous',
    handler: HttpTrigger
});