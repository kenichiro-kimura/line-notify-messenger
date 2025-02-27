import { ILineNotifyMessenger } from './interfaces/lineNotifyMessenger';

export class FunctionsLineNotifyMessenger implements ILineNotifyMessenger {
    private request: any;

    constructor(request: any) {
        this.request = request;
    }

    public buildHttpResponse (status: number, message: string): any {
        return {
            status: status,
            body: message
        };    
    };

    public getHttpRequestPath(): string {
        return this.request.url?.split('api/HttpTrigger')[1] || "";
    }

    public getHttpMethod(): string {
        return this.request.method;
    }

    public getHttpHeader(name: string): string {
        return this.request.headers.get(name) || this.request.headers.get(name.toLowerCase()) || "";
    }

    public async getHttpFormDataAsync(): Promise<any> {
        let formData: any = {};
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

    public async getHttpBodyAsync(): Promise<string> {
        return await this.request.text();
    }
}
