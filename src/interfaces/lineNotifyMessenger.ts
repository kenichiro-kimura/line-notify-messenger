export interface ILineNotifyMessenger {
    buildHttpResponse(status: number, body: string): any;
    getRequestPath(): string;
    getHttpMethod(): string;
    getContentType(): string;
    getBearerToken(): string;
    getFormDataAsync(): Promise<any>;
    getBodyAsync(): Promise<string>;
}
