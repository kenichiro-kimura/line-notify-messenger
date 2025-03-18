/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { AzureFunctionsHttpResponse, IHttpRequestHandler, AwsLambdaHttpResponse } from '@interfaces/httpRequestHandler';
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';
import LineService from '@services/lineService';
import { IGroupRepository } from '@interfaces/groupRepository';
import { SendMode, ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { RequestHandler } from '@handlers/requestHandler';
import { inject, injectable } from 'tsyringe';

/**
 * LINE Notify Messenger アプリケーションのメインクラス
 * HTTPリクエストの処理、LINEメッセージの送信、グループ管理などの機能を提供します
 */
@injectable()
export class LineNotifyMessengerApp {
    /** HTTPリクエスト/レスポンス処理を担当するハンドラー */
    private handler: IHttpRequestHandler;
    /** LINE APIとの通信を担当するサービス */
    private lineService: LineService;
    /** LINEグループ情報の保存と取得を担当するリポジトリ */
    private groupRepository: IGroupRepository;
    /** メッセージ送信モードの戦略を提供するインターフェース */
    private sendModeStrategy: ISendModeStrategy;
    /** HTTPリクエストの処理とデータ抽出を行うハンドラー */
    private requestHandler: RequestHandler;

    /**
     * LineNotifyMessengerAppのコンストラクタ
     * 依存性注入によって必要なサービスとコンポーネントを受け取ります
     * 
     * @param handler - HTTPリクエスト/レスポンス処理用ハンドラー
     * @param lineChannelAccessToken - LINE APIアクセス用トークン
     * @param imageStorage - 画像の保存と取得を担当するストレージ
     * @param imageConverter - 画像形式の変換を担当するコンバーター
     * @param groupRepository - LINEグループ情報管理用リポジトリ
     * @param sendModeStrategy - メッセージ送信モード決定用戦略
     * @param lineService - LINE API通信用サービス
     */
    constructor(
        @inject('IHttpRequestHandler') handler: IHttpRequestHandler,
        @inject('LineChannelAccessToken') lineChannelAccessToken: string,
        @inject('IImageStorage') imageStorage: IImageStorage,
        @inject('IImageConverter') imageConverter: IImageConverter,
        @inject('IGroupRepository') groupRepository: IGroupRepository,
        @inject('ISendModeStrategy') sendModeStrategy: ISendModeStrategy,
        @inject('LineService') lineService: LineService,
    ) {
        this.handler = handler;
        this.lineService = lineService;
        this.groupRepository = groupRepository;
        this.sendModeStrategy = sendModeStrategy;
        this.requestHandler = new RequestHandler(handler); // RequestHandler を初期化
    }
    
    /**
     * 認証エラー用のHTTPレスポンスを生成します
     * @param message - エラーメッセージ
     * @returns 401 Unauthorizedレスポンス
     */
    private httpUnAuthorizedErrorMessage = (message: string): AwsLambdaHttpResponse | AzureFunctionsHttpResponse => {
        return this.handler.buildHttpResponse(401, message);
    };

    /**
     * サーバーエラー用のHTTPレスポンスを生成します
     * @param message - エラーメッセージ
     * @returns 500 Internal Server Errorレスポンス
     */
    private httpInternalServerErrorMessage = (message: string): AwsLambdaHttpResponse | AzureFunctionsHttpResponse => {
        return this.handler.buildHttpResponse(500, message);
    };

    /**
     * 正常応答用のHTTPレスポンスを生成します
     * @param message - 応答メッセージ
     * @returns 200 OKレスポンス
     */
    private httpOkMessage = (message: string): AwsLambdaHttpResponse | AzureFunctionsHttpResponse => {
        return this.handler.buildHttpResponse(200, message);
    };

    /**
     * LINEリクエストボディからグループIDを抽出します
     * @param body - LINEウェブフックリクエストボディ
     * @returns グループID（存在しない場合は空文字列）
     */
    private getRequestGroupId = (body: any): string => {
        return body.events[0]?.source?.groupId || '';
    };

    /**
     * 新しいグループIDをリポジトリに追加します
     * @param groupId - 追加するLINEグループID
     */
    private addGroupId = async (groupId: string) => {
        await this.groupRepository.add(groupId);
    };

    /**
     * 登録済みのすべてのLINEグループIDを取得します
     * @returns グループIDの配列
     */
    private getTargetGroupIds = async (): Promise<string[]> => {
        return this.groupRepository.listAll();
    };

    /**
     * ブロードキャストメッセージを送信します
     * @param formData - 送信するメッセージデータ
     */
    private sendBroadcastMessage = async (formData: any) => {
        await this.lineService.broadcastMessage(formData);
    };

    /**
     * 登録済みの全グループにメッセージを送信します
     * @param formData - 送信するメッセージデータ
     */
    private sendGroupMessage = async (formData: any) => {
        const groupIds: string[] = await this.getTargetGroupIds();
        console.log(`groupIds: ${groupIds}`);
        if (groupIds.length > 0) {
            await this.lineService.groupMessage(groupIds, formData);
        }
    };

    /**
     * 指定された送信モードに基づいてメッセージを送信します
     * @param FormData - 送信するメッセージデータ
     * @param sendMode - メッセージ送信モード
     */
    private sendMessage = async (FormData: any, sendMode: SendMode) => {
        switch (sendMode) {
            case SendMode.broadcast:
                await this.sendBroadcastMessage(FormData);
                break;
            case SendMode.group:
                await this.sendGroupMessage(FormData);
                break;
            case SendMode.all:
                await this.sendBroadcastMessage(FormData);
                await this.sendGroupMessage(FormData);
                break;
        }
    };

    /**
     * ユーザーからのメッセージに対してデフォルトの応答を送信します
     * @param body - LINEウェブフックリクエストボディ
     */
    private replyDefaultMessage = async (body: any) => {
        const replyToken = body.events[0].replyToken;
        await this.lineService.replyMessage(
            replyToken,
            'お送り頂いたメッセージはどこにも送られないのでご注意ください'
        );
    };

    /**
     * 現在設定されている送信モードを取得します
     * @returns 現在の送信モード
     */
    private getSendMode = (): SendMode => {
        return this.sendModeStrategy.getSendMode();
    };

    /**
     * HTTPリクエストを処理し、適切なレスポンスを返します
     * 通知サービスリクエスト、LINEウェブフック、ヘルスチェックなどを処理します
     * @returns HTTPレスポンスオブジェクト
     */
    async processRequest(): Promise<AwsLambdaHttpResponse | AzureFunctionsHttpResponse> {
        const sendMode = this.getSendMode();

        if (this.requestHandler.isNotifyServiceRequest()) {
            const bearerToken = this.requestHandler.getBearerToken();

            if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
                return this.httpUnAuthorizedErrorMessage('Invalid authorization token');
            }

            const formData = await this.requestHandler.getFormData();

            await this.sendMessage(formData, sendMode);
            return this.httpOkMessage('Success Notify');
        }

        const body = await this.requestHandler.getRequestBody();

        /* health check from LINE */
        if (body.events.length === 0) {
            return this.httpOkMessage('No events');
        }

        /* if the request has group id, save group id */
        const groupId: string = this.getRequestGroupId(body);

        if (groupId !== '') {
            await this.addGroupId(groupId);
            return this.httpOkMessage('Success Add Group');
        }

        /* reply default message */
        await this.replyDefaultMessage(body);

        return this.httpOkMessage('Success');
    }
}