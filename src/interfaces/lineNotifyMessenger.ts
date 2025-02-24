export interface ILineNotifyMessenger {
    httpUnAuthorizedErrorMessage(message: string): any;
    httpInternalServerErrorMessage(message: string): any;
    httpOkMessage(message: string): any;
    getRequestPath(): string;
    getHttpMethod(): string;
    getContentType(): string;
    getBearerToken(): string;
    getFormDataAsync(): Promise<any>;
    getBodyAsync(): Promise<string>;
}
