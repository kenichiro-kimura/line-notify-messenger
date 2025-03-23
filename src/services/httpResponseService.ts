import 'reflect-metadata';
import { AzureFunctionsHttpResponse, IHttpRequestHandler, AwsLambdaHttpResponse } from '@interfaces/httpRequestHandler';
import { inject, injectable } from 'tsyringe';

/**
 * HTTPレスポンス生成を担当するサービスクラス
 * 各種ステータスコードとメッセージに応じたレスポンスオブジェクトを生成します
 */
@injectable()
export class HttpResponseService {
    /** HTTPリクエスト/レスポンス処理を担当するハンドラー */
    private handler: IHttpRequestHandler;

    /**
     * HttpResponseServiceのコンストラクタ
     * @param handler HTTPリクエスト/レスポンス処理用ハンドラー
     */
    constructor(
        @inject('IHttpRequestHandler') handler: IHttpRequestHandler,
    ) {
        this.handler = handler;
    }

    /**
     * 認証エラー（401 Unauthorized）用のHTTPレスポンスを生成します
     * @param message エラーメッセージ
     * @returns HTTP 401レスポンスオブジェクト
     */
    httpUnAuthorizedErrorMessage(message: string): AwsLambdaHttpResponse | AzureFunctionsHttpResponse | Response {
        return this.handler.buildHttpResponse(401, message);
    }

    /**
     * サーバーエラー（500 Internal Server Error）用のHTTPレスポンスを生成します
     * @param message エラーメッセージ
     * @returns HTTP 500レスポンスオブジェクト
     */
    httpInternalServerErrorMessage(message: string): AwsLambdaHttpResponse | AzureFunctionsHttpResponse | Response{
        return this.handler.buildHttpResponse(500, message);
    }

    /**
     * 正常応答（200 OK）用のHTTPレスポンスを生成します
     * @param message 応答メッセージ
     * @returns HTTP 200レスポンスオブジェクト
     */
    httpOkMessage(message: string): AwsLambdaHttpResponse | AzureFunctionsHttpResponse | Response{
        return this.handler.buildHttpResponse(200, message);
    }
}
