export interface ILineNotifyMessenger {
    buildHttpResponse(status: number, body: string): any;
    getHttpRequestPath(): string;
    getHttpMethod(): string;
    getHttpHeader(name: string): string;
    getHttpFormDataAsync(): Promise<any>;
    getHttpBodyAsync(): Promise<string>;
}
