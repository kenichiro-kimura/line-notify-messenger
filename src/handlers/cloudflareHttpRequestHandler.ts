/* eslint-disable  @typescript-eslint/no-explicit-any */
import { IHttpRequestHandler } from '@interfaces/httpRequestHandler';

export class CloudflareHttpRequestHandler implements IHttpRequestHandler {
  private request: Request;
  private env: Env;
  private ctx: ExecutionContext;

  /**
   * Cloudflare Workers 用の HTTP リクエストハンドラ
   * @param request Cloudflare Workers のリクエストオブジェクト
   * @param env Cloudflare Workers の環境変数
   * @param ctx Cloudflare Workers の実行コンテキスト
   */
  constructor(request: Request, env: Env, ctx: ExecutionContext) {
    this.request = request;
    this.env = env;
    this.ctx = ctx;
  }

  /**
   * HTTP応答オブジェクトを生成します
   * @param status - HTTPステータスコード
   * @param message - レスポンスメッセージ
   * @returns 生成されたHTTP応答オブジェクト
   */
  public buildHttpResponse(status: number, message: string): Response {
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    
    return new Response(
      JSON.stringify({ message }),
      {
        status: status,
        headers: responseHeaders
      }
    );
  }

  /**
   * リクエストURLからパス部分を抽出します
   * @returns リクエストパス
   */
  public getHttpRequestPath(): string {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    const url = new URL(this.request.url);
    return url.pathname;
  }

  /**
   * HTTPリクエストメソッド（GET, POST等）を取得します
   * @returns HTTPメソッド文字列
   */
  public getHttpMethod(): string {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.method;
  }

  /**
   * 指定された名前のHTTPヘッダー値を取得します
   * 大文字小文字を区別せずに検索します
   * @param name - 取得するヘッダー名
   * @returns ヘッダー値（存在しない場合は空文字列）
   */
  public getHttpHeader(name: string): string {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.headers.get(name) || this.request.headers.get(name.toLowerCase()) || "";
  }

  /**
   * POSTリクエストのフォームデータを非同期に取得して処理します
   * multipart/form-dataの場合は特別な処理を行い、画像ファイルを適切に処理します
   * @returns 処理済みのフォームデータオブジェクト
   */
  public async getHttpFormDataAsync(): Promise<any> {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    const formData: any = {};
    try {
      const rawFormData = await this.request.formData();
      if (this.getHttpHeader('Content-Type').startsWith('multipart/form-data')) {
        formData.message = rawFormData.get('message');
        const imageFile = rawFormData.get('imageFile');
        if (imageFile && imageFile instanceof File) {
          formData.imageFile = {
            'filename': imageFile.name,
            'contentType': imageFile.type,
            'content': new Uint8Array(await imageFile.arrayBuffer()),
            'type': 'file'
          };
        }
      } else {
        for (const [key, value] of rawFormData.entries()) {
          formData[key] = value;
        }
      }
      return formData;
    } catch (error) {
      console.error('Form data parsing error:', error);
      return formData;
    }
  }

  /**
   * HTTPリクエストのボディテキストを非同期に取得します
   * @returns リクエストボディの文字列
   */
  public async getHttpBodyAsync(): Promise<string> {
    if (!this.request) {
      throw new Error('Request is not set.');
    }

    return await this.request.text();
  }

  /**
   * リクエストがLINE Notifyのルートを使用しているかチェックします
   * @returns notifyルートを使用している場合はtrue、そうでなければfalse
   */
  public isNotifyRoute(): boolean {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.url.toLowerCase().includes('/notify');
  }

  /**
   * リクエストヘッダーからLINEシグネチャを取得します
   * @returns x-line-signatureヘッダー値または未定義
   */
  public getLineSignature(): string | undefined {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.headers.get('x-line-signature') || undefined;
  }

  /**
   * リクエストの URL からクエリパラメータを取得します
   * @param name - URLパラメータ名
   * @returns パラメータ値または未定義
   */
  public getQueryParameter(name: string): string | undefined {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    const url = new URL(this.request.url);
    return url.searchParams.get(name) || undefined;
  }

  /**
   * リクエスト本文を解析して JSON として返します
   * @returns JSON としてパースされたリクエスト本文
   */
  async parseRequestBody<T>(): Promise<T> {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    const contentType = this.request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await this.request.json() as T;
    } else {
      throw new Error('Unsupported content type. Expected application/json');
    }
  }

  /**
   * レスポンスを生成します
   * @param statusCode HTTP ステータスコード
   * @param body レスポンス本文
   * @param headers レスポンスヘッダー
   * @returns Response オブジェクト
   */
  createResponse(statusCode: number, body: any, headers?: Record<string, string>): Response {
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });
    }

    return new Response(
      typeof body === 'string' ? body : JSON.stringify(body),
      {
        status: statusCode,
        headers: responseHeaders
      }
    );
  }

  /**
   * リクエストヘッダーを取得します
   * @param headerName ヘッダー名
   * @returns ヘッダーの値
   */
  getHeader(headerName: string): string | null {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.headers.get(headerName);
  }

  /**
   * HTTP メソッドを取得します
   * @returns HTTP メソッド
   */
  getMethod(): string {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.method;
  }

  /**
   * リクエスト URL を取得します
   * @returns リクエスト URL
   */
  getUrl(): string {
    if (!this.request) {
      throw new Error('Request is not set.');
    }
    
    return this.request.url;
  }
}