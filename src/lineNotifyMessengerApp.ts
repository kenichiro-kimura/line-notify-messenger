/* eslint-disable  @typescript-eslint/no-explicit-any */
import { FunctionsHttpResponse, ILineNotifyMessenger, LambdaHttpResponse } from './interfaces/lineNotifyMessenger';
import { IImageStorage } from './interfaces/imageStorage';
import { IImageConverter } from './interfaces/imageConverter';
import LineService from './lineService';

export class LineNotifyMessengerApp {
    private messenger: ILineNotifyMessenger;
    private lineService: LineService;

    constructor  (messenger:ILineNotifyMessenger, lineChannelAccessToken: string,imageStorage: IImageStorage, imageConverter: IImageConverter) {
        this.messenger = messenger;
        this.lineService = new LineService(lineChannelAccessToken, imageStorage, imageConverter);
    }

    private httpUnAuthorizedErrorMessage = (message: string): LambdaHttpResponse | FunctionsHttpResponse => {
        return this.messenger.buildHttpResponse(401, message);
    }

    private httpInternalServerErrorMessage = (message: string):  LambdaHttpResponse | FunctionsHttpResponse => {
        return this.messenger.buildHttpResponse(500, message);
    }
    
    private httpOkMessage = (message: string):  LambdaHttpResponse | FunctionsHttpResponse => {
        return this.messenger.buildHttpResponse(200, message);
    }

    private getBearerToken = () => {
        return this.messenger.getHttpHeader('Authorization').split('Bearer ')[1] || "";
    }

    private isNotifyServiceRequest = () => {
        const path = this.messenger.getHttpRequestPath();
        const method = this.messenger.getHttpMethod();
        const contentType = this.messenger.getHttpHeader('Content-Type');

        if(path === '/notify' && method === 'POST' && ( contentType === 'application/x-www-form-urlencoded' || contentType.startsWith('multipart/form-data'))) {
            return true;
        }
        return false;
    };
    
    private sendBroadcastMessage = async (formData: any) => {
        await this.lineService.broadcastMessage(formData);
    };
    
    private replyDefaultMessage = async (body: any) => {
        const replyToken = body.events[0].replyToken;
        await this.lineService.replyMessage(replyToken, 'お送り頂いたメッセージはどこにも送られないのでご注意ください');
    };
    
    async processRequest(): Promise<LambdaHttpResponse | FunctionsHttpResponse> {
        if(this.isNotifyServiceRequest()) {
            const bearerToken = this.getBearerToken();
    
            if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
                return this.httpUnAuthorizedErrorMessage('Invalid authorization token');
            }
    
            const formData = await this.messenger.getHttpFormDataAsync();
    
            await this.sendBroadcastMessage(formData);
            return this.httpOkMessage('Success Notify');
        }
    
        const body = JSON.parse(await this.messenger.getHttpBodyAsync());
    
        /* health check from LINE */
        if(body.events.length === 0) {
            return this.httpOkMessage('No events');
        }
    
        /* reply default message */
        await this.replyDefaultMessage(body);
    
        return this.httpOkMessage('Success');
    }       
}