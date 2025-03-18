import 'reflect-metadata';
import { FunctionsHttpResponse, ILineNotifyMessenger, LambdaHttpResponse } from '@interfaces/lineNotifyMessenger';
import { inject, injectable } from 'tsyringe';

/**
 * HTTPレスポンス生成を担当するサービスクラス
 * 各種ステータスコードとメッセージに応じたレスポンスオブジェクトを生成します
 */
@injectable()
export class HttpResponseService {
    /** HTTPリクエスト/レスポンス処理を担当するメッセンジャー */
    private messenger: ILineNotifyMessenger;

    /**
     * HttpResponseServiceのコンストラクタ
     * @param messenger HTTPリクエスト/レスポンス処理用メッセンジャー
     */
    constructor(
        @inject('ILineNotifyMessenger') messenger: ILineNotifyMessenger,
    ) {
        this.messenger = messenger;
    }

    /**
     * 認証エラー（401 Unauthorized）用のHTTPレスポンスを生成します
     * @param message エラーメッセージ
     * @returns HTTP 401レスポンスオブジェクト
     */
    httpUnAuthorizedErrorMessage(message: string): LambdaHttpResponse | FunctionsHttpResponse {
        return this.messenger.buildHttpResponse(401, message);
    }

    /**
     * サーバーエラー（500 Internal Server Error）用のHTTPレスポンスを生成します
     * @param message エラーメッセージ
     * @returns HTTP 500レスポンスオブジェクト
     */
    httpInternalServerErrorMessage(message: string): LambdaHttpResponse | FunctionsHttpResponse {
        return this.messenger.buildHttpResponse(500, message);
    }

    /**
     * 正常応答（200 OK）用のHTTPレスポンスを生成します
     * @param message 応答メッセージ
     * @returns HTTP 200レスポンスオブジェクト
     */
    httpOkMessage(message: string): LambdaHttpResponse | FunctionsHttpResponse {
        return this.messenger.buildHttpResponse(200, message);
    }
}
