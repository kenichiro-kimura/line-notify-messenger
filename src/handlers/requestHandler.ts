/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { IHttpRequestHandler } from '@interfaces/httpRequestHandler';
import { inject, injectable } from 'tsyringe';

/**
 * HTTPリクエスト処理を担当するハンドラークラス
 * IHttpRequestHandlerを利用してリクエストの解析と必要なデータの抽出を行います
 */
@injectable()
export class RequestHandler {
    /** HTTPリクエスト/レスポンス処理を担当するハンドラー */
    private handler: IHttpRequestHandler;

    /**
     * RequestHandlerのコンストラクタ
     * @param handler - HTTPリクエスト/レスポンス処理用ハンドラー
     */
    constructor(
        @inject('IHttpRequestHandler') handler: IHttpRequestHandler,
    ) {
        this.handler = handler;
    }

    /**
     * Authorization ヘッダーからBearerトークンを抽出します
     * @returns Bearerトークン（存在しない場合は空文字列）
     */
    getBearerToken(): string {
        return this.handler.getHttpHeader('Authorization').split('Bearer ')[1] || '';
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
        const path = this.handler.getHttpRequestPath();
        const method = this.handler.getHttpMethod();
        const contentType = this.handler.getHttpHeader('Content-Type');

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
        return JSON.parse(await this.handler.getHttpBodyAsync());
    }

    /**
     * フォームデータを取得して処理します
     * 実際の処理はIHttpRequestHandlerの実装に委譲されます
     * @returns 処理されたフォームデータ
     */
    async getFormData(): Promise<any> {
        return this.handler.getHttpFormDataAsync();
    }
}