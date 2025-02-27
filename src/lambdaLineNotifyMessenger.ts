/* eslint-disable  @typescript-eslint/no-explicit-any */
import { parse } from 'querystring';
import { ILineNotifyMessenger } from './interfaces/lineNotifyMessenger';
import * as multipart from 'aws-lambda-multipart-parser';

export class LambdaLineNotifyMessenger implements ILineNotifyMessenger {
    private event: any;

    constructor(event: any) {
        this.event = event;
        if (this.event.isBase64Encoded === true){
            this.event.body = Buffer.from(this.event.body, 'base64').toString('binary');
        }
    }

    public buildHttpResponse (status: number, message: string): any {
        return {
            statusCode: status,
            body: JSON.stringify({ message: message })
        };
    }

    public getHttpRequestPath(): string {
        return this.event.rawPath;
    }

    public getHttpMethod(): string {
        return this.event.requestContext?.http?.method || "";
    }

    public getHttpHeader(name: string): string {
        return this.event.headers?.[name] || this.event.headers?.[name.toLowerCase()] || "";
    }
    public async getHttpFormDataAsync(): Promise<any> {
        return (this.getHttpHeader('Content-Type').startsWith('multipart/form-data')) ? multipart.parse(this.event,true) : parse(await this.getHttpBodyAsync());
    }

    public async getHttpBodyAsync(): Promise<string> {
        return this.event.body;
    }
}
