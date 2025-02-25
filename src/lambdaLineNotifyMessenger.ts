import { parse } from 'querystring';
import { ILineNotifyMessenger } from './interfaces/lineNotifyMessenger';

const multipart = require('aws-lambda-multipart-parser');

export class LambdaLineNotifyMessenger implements ILineNotifyMessenger {
    private event: any;

    constructor(event: any) {
        this.event = event;
        if (this.event.isBase64Encoded === true){
            this.event.body = Buffer.from(this.event.body, 'base64').toString('binary');
        }
    }

    public httpUnAuthorizedErrorMessage (message: string): any {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: message }),
        };
    };

    public httpInternalServerErrorMessage(message: string): any {
        return {
            statusCode: 500,
            body: JSON.stringify({ message:message }),
        };
    };

    public httpOkMessage(message: string): any {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: message }),
        };
    };

    public getRequestPath(): string {
        return this.event.rawPath;
    }

    public getHttpMethod(): string {
        return this.event.requestContext?.http?.method || "";
    }

    public getContentType(): string {
        return  this.event.headers?.['content-type'] || this.event.headers?.['Content-Type'] || "";
    }

    public getBearerToken(): string {
        return this.event.headers?.authorization?.split('Bearer ')[1] || "";
    }

    public async getFormDataAsync(): Promise<any> {
        return (this.getContentType().startsWith('multipart/form-data')) ? multipart.parse(this.event,true) : parse(await this.getBodyAsync());
    }

    public async getBodyAsync(): Promise<string> {
        return this.event.body;
    }
}
