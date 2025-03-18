/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { ILineNotifyMessenger } from '@interfaces/lineNotifyMessenger';
import { inject, injectable } from 'tsyringe';

/**
 * HTTPリクエスト処理を担当するハンドラークラス
 * ILineNotifyMessengerを利用してリクエストの解析と必要なデータの抽出を行います
 */
@injectable()
export class RequestHandler {
    /** HTTPリクエスト/レスポンス処理を担当するメッセンジャー */
    private messenger: ILineNotifyMessenger;

    /**
     * RequestHandlerのコンストラクタ
     * @param messenger - HTTPリクエスト/レスポンス処理用メッセンジャー
     */
    constructor(
        @inject('ILineNotifyMessenger') messenger: ILineNotifyMessenger,
    ) {
        this.messenger = messenger;
    }

    /**
     * Authorization ヘッダーからBearerトークンを抽出します
     * @returns Bearerトークン（存在しない場合は空文字列）
     */
    getBearerToken(): string {
        return this.messenger.getHttpHeader('Authorization').split('Bearer ')[1] || '';
    }

    /**
     * リクエストが通知サービス向けかどうかを判定します
     * 以下の条件を満たす場合に通知サービス向けと判定されます:
     * 1. パスが '/notify' である
     * 2. メソッドが 'POST' である
     * 3. コンテンツタイプが 'application/x-www-form-urlencoded' または 'multipart/form-data' で始まる
     * @returns 通知サービス向けの場合はtrue、そうでない場合はfalse
     */
    isNotifyServiceRequest(): boolean {
        const path = this.messenger.getHttpRequestPath();
        const method = this.messenger.getHttpMethod();
        const contentType = this.messenger.getHttpHeader('Content-Type');

        return (
            path === '/notify' &&
            method === 'POST' &&
            (contentType === 'application/x-www-form-urlencoded' || contentType.startsWith('multipart/form-data'))
        );
    }

    /**
     * リクエストボディをJSONとして解析して取得します
     * @returns 解析されたJSONオブジェクト
     */
    async getRequestBody(): Promise<any> {
        return JSON.parse(await this.messenger.getHttpBodyAsync());
    }

    /**
     * フォームデータを取得して処理します
     * 実際の処理はILineNotifyMessengerの実装に委譲されます
     * @returns 処理されたフォームデータ
     */
    async getFormData(): Promise<any> {
        return this.messenger.getHttpFormDataAsync();
    }
}