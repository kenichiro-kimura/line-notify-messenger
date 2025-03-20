import 'reflect-metadata';
import { container } from 'tsyringe';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobImageStorage } from "@repositories/blobImageStorage";
import { JimpImageConverter } from "@utils/jimpImageConverter";
import { FunctionsHttpRequestHandler } from "@handlers/functionsHttpRequestHandler";
import { LineNotifyMessengerApp } from "@core/lineNotifyMessengerApp";
import { AzureFunctionsHttpResponse } from "@interfaces/httpRequestHandler";
import { TableStorageGroupRepository } from "@repositories/tableStorageGroupRepository";
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';
import { IGroupRepository } from '@interfaces/groupRepository';
import { IHttpRequestHandler } from '@interfaces/httpRequestHandler';
import { ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { ICheckAuthorizationToken } from '@interfaces/checkAuthorizationToken';
import { EnvironmentSendModeStrategy } from '@strategies/sendModeStrategy';
import { DefaultCheckAuthorizationTokenStrategy } from '@strategies/checkAuthorizationTokenStrategy';
import LineService from '@services/lineService';

/**
 * Azure Functions用のHTTPトリガー関数
 * LINE NotifyメッセージングアプリケーションのHTTPリクエストを処理します
 * 
 * 依存関係の設定を行い、LineNotifyMessengerAppにリクエストの処理を委譲します
 * 
 * @param request - HTTP要求オブジェクト
 * @param context - Azure Functions実行コンテキスト
 * @returns HTTP応答オブジェクト
 */
export async function HttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Received request:', request);

    // 環境変数のチェック
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
    container.registerInstance<IHttpRequestHandler>('IHttpRequestHandler', new FunctionsHttpRequestHandler(request));
    container.register<ISendModeStrategy>('ISendModeStrategy', { useClass: EnvironmentSendModeStrategy });
    container.register<ICheckAuthorizationToken>('ICheckAuthorizationToken', { useClass: DefaultCheckAuthorizationTokenStrategy });
    container.register('LineService', { useClass: LineService });

    // TsyringeでLineNotifyMessengerAppを解決
    const app = container.resolve(LineNotifyMessengerApp);

    return await app.processRequest() as AzureFunctionsHttpResponse;
}

/**
 * メインのHTTPエンドポイント設定
 * すべてのHTTPメソッドを受け付け、認証なしでアクセス可能
 */
app.http('HttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: HttpTrigger
});

/**
 * 通知専用のHTTPエンドポイント設定
 * /notify パスへのルーティングを行い、同じハンドラ関数で処理
 */
app.http('HttpTriggerNotify', {
    methods: ['GET', 'POST'],
    route: 'HttpTrigger/notify',
    authLevel: 'anonymous',
    handler: HttpTrigger
});