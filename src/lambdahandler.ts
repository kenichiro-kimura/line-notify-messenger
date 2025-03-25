/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { S3ImageStorage } from '@repositories/s3ImageStorage';
import { JimpImageConverter } from '@utils/jimpImageConverter';
import { LambdaHttpRequestHandler } from '@handlers/lambdaHttpRequestHandler';
import { LineNotifyMessengerApp } from '@core/lineNotifyMessengerApp';
import { AwsLambdaHttpResponse, IHttpRequestHandler } from '@interfaces/httpRequestHandler';
import { DynamoGroupRepository } from '@repositories/dynamoGroupRepository';
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';
import { IGroupRepository } from '@interfaces/groupRepository';
import { ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { ICheckAuthorizationToken } from '@interfaces/checkAuthorizationToken';
import { EnvironmentSendModeStrategy } from '@strategies/sendModeStrategy';
import { DefaultCheckAuthorizationTokenStrategy } from '@strategies/checkAuthorizationTokenStrategy';
import LineService from '@services/lineService';

/**
 * AWS Lambda用のメインハンドラー関数
 * HTTPリクエストを処理し、LINE Notifyメッセージを送信します
 * 
 * 環境変数から必要な設定を読み込み、依存性注入を設定して
 * LineNotifyMessengerAppにリクエスト処理を委譲します
 * 
 * 必要な環境変数:
 * - LINE_CHANNEL_ACCESS_TOKEN: LINE Messaging API用のアクセストークン
 * - BUCKET_NAME: 画像保存用のS3バケット名
 * - S3_REGION: S3バケットのAWSリージョン
 * - TABLE_NAME: グループ情報保存用のDynamoDBテーブル名
 * - DYNAMO_REGION: DynamoDBのAWSリージョン
 * - SEND_MODE: 送信モード（broadcast、group、all）（オプション）
 * 
 * @param event - 受け取るイベントオブジェクト
 * @returns HTTP応答オブジェクト
 */
export const handler = async (event: any): Promise<AwsLambdaHttpResponse> => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // 環境変数のチェック
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
    container.registerInstance('AuthorizationToken', process.env.AUTHORIZATION_TOKEN);
    container.registerInstance<IImageStorage>('IImageStorage', new S3ImageStorage(bucketName, s3Region));
    container.register<IImageConverter>('IImageConverter', JimpImageConverter);
    container.registerInstance<IGroupRepository>('IGroupRepository', new DynamoGroupRepository(tableName, dynamoRegion));
    container.registerInstance<IHttpRequestHandler>('IHttpRequestHandler', new LambdaHttpRequestHandler(event));
    container.register<ISendModeStrategy>('ISendModeStrategy', { useClass: EnvironmentSendModeStrategy });
    container.register('LineService', { useClass: LineService });
    container.register<ICheckAuthorizationToken>('ICheckAuthorizationToken', { useClass: DefaultCheckAuthorizationTokenStrategy });

    // TsyringeでLineNotifyMessengerAppを解決
    const app = container.resolve(LineNotifyMessengerApp);

    // リクエスト処理を委譲し、結果を返す
    return await app.processRequest() as AwsLambdaHttpResponse;
};
