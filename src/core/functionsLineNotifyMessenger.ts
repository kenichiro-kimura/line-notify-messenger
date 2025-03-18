/* eslint-disable  @typescript-eslint/no-explicit-any */
import { ILineNotifyMessenger, FunctionsHttpResponse } from '@interfaces/lineNotifyMessenger';

/**
 * Azure Functions環境用のLINE Notify Messengerの実装クラス
 * HTTP要求を処理し、LINE Notifyに必要なデータを抽出するためのメソッドを提供します
 * 
 * このクラスはHTTPリクエストオブジェクトをラップし、LINE Notifyに関連する
 * データ処理とレスポンス生成の責務を担います。ILineNotifyMessengerインターフェースを実装し、
 * Azure Functions固有の実装を提供します。
 */
export class FunctionsLineNotifyMessenger implements ILineNotifyMessenger {
    /** Azure Functionsから受け取ったHTTPリクエストオブジェクト */
    private request: any;

    /**
     * FunctionsLineNotifyMessengerのコンストラクタ
     * @param request - Azure Functionsから受け取ったHTTPリクエストオブジェクト
     */
    constructor(request: any) {
        this.request = request;
    }

    /**
     * HTTP応答オブジェクトを生成します
     * @param status - HTTPステータスコード
     * @param message - レスポンスメッセージ
     * @returns 生成されたHTTP応答オブジェクト
     */
    public buildHttpResponse(status: number, message: string): FunctionsHttpResponse {
        return new FunctionsHttpResponse(status, message);
    }

    /**
     * リクエストURLからパス部分を抽出します
     * @returns リクエストパス（"api/HttpTrigger"以降の部分）
     */
    public getHttpRequestPath(): string {
        return this.request.url?.split('api/HttpTrigger')[1] || "";
    }

    /**
     * HTTPリクエストメソッド（GET, POST等）を取得します
     * @returns HTTPメソッド文字列
     */
    public getHttpMethod(): string {
        return this.request.method;
    }

    /**
     * 指定された名前のHTTPヘッダー値を取得します
     * 大文字小文字を区別せずに検索します
     * @param name - 取得するヘッダー名
     * @returns ヘッダー値（存在しない場合は空文字列）
     */
    public getHttpHeader(name: string): string {
        return this.request.headers.get(name) || this.request.headers.get(name.toLowerCase()) || "";
    }

    /**
     * POSTリクエストのフォームデータを非同期に取得して処理します
     * multipart/form-dataの場合は特別な処理を行い、画像ファイルを適切に処理します
     * @returns 処理済みのフォームデータオブジェクト
     */
    public async getHttpFormDataAsync(): Promise<any> {
        const formData: any = {};
        const rawFormData = await this.request.formData();
        if (this.getHttpHeader('Content-Type').startsWith('multipart/form-data')) {
            formData.message = rawFormData.get('message');
            const imageFile : any = rawFormData.get('imageFile');
            formData.imageFile = {
                'filename': imageFile.name,
                'contentType': imageFile.type,
                'content': Buffer.from(await imageFile.arrayBuffer()),
                'type': 'file'
            }
        } else {
            rawFormData.forEach((value: FormDataEntryValue, key: string) => {
                formData[key] = value;
            });
        }
        return formData;
    }

    /**
     * HTTPリクエストのボディテキストを非同期に取得します
     * @returns リクエストボディの文字列
     */
    public async getHttpBodyAsync(): Promise<string> {
        return await this.request.text();
    }

    /**
     * リクエストデータからテキストボディを取得します
     * @returns リクエストボディの文字列表現を含むPromise
     */
    public async getRequestBodyText(): Promise<string> {
        return await this.request.text();
    }

    /**
     * リクエストがLINE Notifyのルートを使用しているかチェックします
     * @returns notifyルートを使用している場合はtrue、そうでなければfalse
     */
    public isNotifyRoute(): boolean {
        // URLパスにnotifyが含まれているかチェック
        return this.request.url.toLowerCase().includes('/notify');
    }

    /**
     * リクエストヘッダーからLINEシグネチャを取得します
     * @returns x-line-signatureヘッダー値または未定義
     */
    public getLineSignature(): string | undefined {
        return this.request.headers.get('x-line-signature');
    }

    /**
     * リクエストURLからパラメータを取得します
     * @param name - URLパラメータ名
     * @returns パラメータ値または未定義
     */
    public getQueryParameter(name: string): string | undefined {
        const params = new URL(this.request.url).searchParams;
        return params.get(name) || undefined;
    }
}
