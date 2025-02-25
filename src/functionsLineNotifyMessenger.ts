import { ILineNotifyMessenger } from './interfaces/lineNotifyMessenger';

export class FunctionsLineNotifyMessenger implements ILineNotifyMessenger {
    private request: any;

    constructor(request: any) {
        this.request = request;
    }

    public httpInvalidRequestErrorMessage(message: string): any {
        return {
            status: 400,
            body: message
        };
    };

    public httpUnAuthorizedErrorMessage (message: string): any {
        return {
            status: 401,
            body: message
        };    
    };

    public httpInternalServerErrorMessage(message: string): any {
        return {
            status: 500,
            body: message
        };
    };

    public httpOkMessage(message: string): any {
        return {
            status: 200,
            body: message
        };
    };

    public getRequestPath(): string {
        return this.request.url?.split('api/HttpTrigger')[1] || "";
    }

    public getHttpMethod(): string {
        return this.request.method;
    }

    public getContentType(): string {
        return this.request.headers.get('content-type') || this.request.headers.get('Content-Type') || "";
    }

    public getBearerToken(): string {
        return this.request.headers.get('Authorization')?.split('Bearer ')[1] || "";
    }

    public async getFormDataAsync(): Promise<any> {
        let formData: any = {};
        const rawFormData = await this.request.formData();
        if (this.getContentType().startsWith('multipart/form-data')) {
            formData.message = rawFormData.get('message');
            const imageFile : any = rawFormData.get('imageFile');
            formData.imageFile = {
                'filename': imageFile.name,
                'contentType': imageFile.type,
                'content': Buffer.from(await imageFile.arrayBuffer())
            }
        } else {
            rawFormData.forEach((value, key) => {
                formData[key] = value;
            });
        }
        return formData;
    }

    public async getBodyAsync(): Promise<string> {
        return await this.request.text();
    }
}
