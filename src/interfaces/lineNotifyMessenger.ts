/* eslint-disable  @typescript-eslint/no-explicit-any */
export class FunctionsHttpResponse {
    public status: number;
    public body: string;

    constructor(status: number, body: string) {
        this.status = status;
        this.body = body;
    }
}

export class LambdaHttpResponse {
    public statusCode: number;
    public body: string;

    constructor(statusCode: number, body: string) {
        this.statusCode = statusCode;
        this.body = body;
    }
}

export interface ILineNotifyMessenger {
    buildHttpResponse(status: number, body: string): FunctionsHttpResponse | LambdaHttpResponse;
    getHttpRequestPath(): string;
    getHttpMethod(): string;
    getHttpHeader(name: string): string;
    getHttpFormDataAsync(): Promise<any>;
    getHttpBodyAsync(): Promise<string>;
}
