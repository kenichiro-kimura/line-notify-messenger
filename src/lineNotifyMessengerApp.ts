import { ILineNotifyMessenger } from './interfaces/lineNotifyMessenger';
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

    private httpUnAuthorizedErrorMessage = (message: string): any => {
        return this.messenger.buildHttpResponse(401, message);
    }

    private httpInternalServerErrorMessage = (message: string): any => {
        return this.messenger.buildHttpResponse(500, message);
    }
    
    private httpOkMessage = (message: string): any => {
        return this.messenger.buildHttpResponse(200, message);
    }

    private isNotifyServiceRequest = () => {
        const path = this.messenger.getRequestPath();
        const method = this.messenger.getHttpMethod();
        const contentType = this.messenger.getContentType();

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
    
    async processRequest() {
        if(this.isNotifyServiceRequest()) {
            const bearerToken = this.messenger.getBearerToken();
    
            if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
                return this.httpUnAuthorizedErrorMessage('Invalid authorization token');
            }
    
            const formData = await this.messenger.getFormDataAsync();
    
            await this.sendBroadcastMessage(formData);
            return this.httpOkMessage('Success Notify');
        }
    
        const body = JSON.parse(await this.messenger.getBodyAsync());
    
        /* health check from LINE */
        if(body.events.length === 0) {
            return this.httpOkMessage('No events');
        }
    
        /* reply default message */
        await this.replyDefaultMessage(body);
    
        return this.httpOkMessage('Success');
    };
        
}