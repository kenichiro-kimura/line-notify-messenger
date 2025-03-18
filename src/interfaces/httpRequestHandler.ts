/* eslint-disable  @typescript-eslint/no-explicit-any */

/**
 * Azure Functions用のHTTPレスポンスクラス
 * Azure Functions環境でHTTPレスポンスを表現します
 */
export class AzureFunctionsHttpResponse {
    /** HTTPステータスコード */
    public status: number;
    /** レスポンスボディの内容 */
    public body: string;

    /**
     * AzureFunctionsHttpResponseのコンストラクタ
     * @param status - HTTPステータスコード
     * @param body - レスポンスボディの内容
     */
    constructor(status: number, body: string) {
        this.status = status;
        this.body = body;
    }
}

/**
 * AWS Lambda用のHTTPレスポンスクラス
 * API Gateway + Lambda環境でHTTPレスポンスを表現します
 */
export class AwsLambdaHttpResponse {
    /** HTTPステータスコード */
    public statusCode: number;
    /** レスポンスボディの内容 */
    public body: string;

    /**
     * AwsLambdaHttpResponseのコンストラクタ
     * @param statusCode - HTTPステータスコード
     * @param body - レスポンスボディの内容
     */
    constructor(statusCode: number, body: string) {
        this.statusCode = statusCode;
        this.body = body;
    }
}

/**
 * LINE Notify Messengerの共通インターフェース
 * 異なる実行環境（Azure Functions、AWS Lambda）間で
 * HTTPリクエスト処理を抽象化します
 */
export interface IHttpRequestHandler {
    /**
     * HTTP応答オブジェクトを生成します
     * @param status - HTTPステータスコード
     * @param body - レスポンスボディの内容
     * @returns 実行環境に対応したHTTPレスポンスオブジェクト
     */
    buildHttpResponse(status: number, body: string): AzureFunctionsHttpResponse | AwsLambdaHttpResponse;
    
    /**
     * リクエストURLからパス部分を取得します
     * @returns リクエストのURLパス
     */
    getHttpRequestPath(): string;
    
    /**
     * HTTPリクエストメソッドを取得します
     * @returns HTTPメソッド文字列（GET, POST等）
     */
    getHttpMethod(): string;
    
    /**
     * 指定された名前のHTTPヘッダー値を取得します
     * @param name - 取得するヘッダー名
     * @returns ヘッダー値
     */
    getHttpHeader(name: string): string;
    
    /**
     * POSTリクエストのフォームデータを非同期に取得します
     * @returns 処理済みのフォームデータ
     */
    getHttpFormDataAsync(): Promise<any>;
    
    /**
     * HTTPリクエストのボディを非同期に取得します
     * @returns リクエストボディの文字列
     */
    getHttpBodyAsync(): Promise<string>;
}
