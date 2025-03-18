/* eslint-disable  @typescript-eslint/no-explicit-any */
import { parse } from 'querystring';
import { ILineNotifyMessenger, LambdaHttpResponse } from '@interfaces/lineNotifyMessenger';
import * as multipart from 'aws-lambda-multipart-parser';

/**
 * AWS Lambda環境用のLINE Notify Messengerの実装クラス
 * HTTP要求を処理し、LINE Notifyに必要なデータを抽出するためのメソッドを提供します
 */
export class LambdaLineNotifyMessenger implements ILineNotifyMessenger {
    /** AWS Lambdaから受け取ったイベントオブジェクト */
    private event: any;

    /**
     * LambdaLineNotifyMessengerのコンストラクタ
     * @param event - AWS Lambdaから受け取ったイベントオブジェクト
     */
    constructor(event: any) {
        this.event = event;
        if (this.event.isBase64Encoded === true){
            this.event.body = Buffer.from(this.event.body, 'base64').toString('binary');
        }
    }

    /**
     * HTTP応答オブジェクトを生成します
     * @param status - HTTPステータスコード
     * @param message - レスポンスメッセージ
     * @returns 生成されたHTTP応答オブジェクト
     */
    public buildHttpResponse (status: number, message: string): LambdaHttpResponse {
        return new LambdaHttpResponse(status,JSON.stringify({ message: message }));
    }

    /**
     * リクエストURLからパス部分を抽出します
     * @returns APIゲートウェイから提供されるリクエストパス
     */
    public getHttpRequestPath(): string {
        return this.event.rawPath;
    }

    /**
     * HTTPリクエストメソッド（GET, POST等）を取得します
     * @returns HTTPメソッド文字列
     */
    public getHttpMethod(): string {
        return this.event.requestContext?.http?.method || "";
    }

    /**
     * 指定された名前のHTTPヘッダー値を取得します
     * 大文字小文字を区別せずに検索します
     * @param name - 取得するヘッダー名
     * @returns ヘッダー値（存在しない場合は空文字列）
     */
    public getHttpHeader(name: string): string {
        return this.event.headers?.[name] || this.event.headers?.[name.toLowerCase()] || "";
    }

    /**
     * POSTリクエストのフォームデータを非同期に取得して処理します
     * multipart/form-dataの場合はaws-lambda-multipart-parserを使用して処理し、
     * それ以外の場合はquerystring.parseを使用してデータを解析します
     * @returns 処理済みのフォームデータオブジェクト
     */
    public async getHttpFormDataAsync(): Promise<any> {
        return (this.getHttpHeader('Content-Type').startsWith('multipart/form-data')) ? multipart.parse(this.event,true) : parse(await this.getHttpBodyAsync());
    }

    /**
     * HTTPリクエストのボディテキストを取得します
     * コンストラクタでBase64エンコードされたボディはコンストラクタでデコード済み
     * @returns リクエストボディの文字列
     */
    public async getHttpBodyAsync(): Promise<string> {
        return this.event.body;
    }
}
