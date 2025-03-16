/* eslint-disable  @typescript-eslint/no-explicit-any */
import { FunctionsHttpResponse, ILineNotifyMessenger, LambdaHttpResponse } from './interfaces/lineNotifyMessenger';
import { IImageStorage } from './interfaces/imageStorage';
import { IImageConverter } from './interfaces/imageConverter';
import LineService from './lineService';
import { IGroupRepository } from './interfaces/groupRepository';

enum SendMode {
    broadcast = 'broadcast',
    group = 'group',
    all = 'all'
}

export class LineNotifyMessengerApp {
    private messenger: ILineNotifyMessenger;
    private lineService: LineService;
    private groupRepository: IGroupRepository;

    constructor  (messenger:ILineNotifyMessenger, lineChannelAccessToken: string,imageStorage: IImageStorage, imageConverter: IImageConverter, groupRepository: IGroupRepository) {
        this.messenger = messenger;
        this.groupRepository = groupRepository;
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
    }
    
    private getRequestGroupId = (body: any) : string => {
        return body.events[0]?.source?.groupId || "";
    }

    private addGroupId = async (groupId: string) => {
        await this.groupRepository.add(groupId);
    }

    private getTargetGroupIds = async () : Promise<string[]> => {
        return Promise.resolve([]);
    }

    private getSendMode = () : SendMode => {
        const mode = process.env.SEND_MODE || SendMode.broadcast;
        // process.env.SEND_MODEがSendModeに変換できない場合はSendMode.broadcastを返す
        if (!Object.values(SendMode).includes(mode as SendMode)) {
            return SendMode.broadcast;
        } else {
            return mode as SendMode;
        } 
    }

    private sendBroadcastMessage = async (formData: any) => {
        await this.lineService.broadcastMessage(formData);
    }
    
    private sendGroupMessage = async (formData: any) => {
        const groupIds : string [] = await this.getTargetGroupIds();
        if(groupIds.length > 0) {
            await this.lineService.sendGroupMessage(groupIds, formData);
        }
    }

    private sendMessage = async (FormData: any, sendMode: SendMode) => {
        switch (sendMode) {
            case SendMode.broadcast:
                await this.sendBroadcastMessage(FormData);
                break;
            case SendMode.group:
                await this.sendGroupMessage(FormData);
                break;
            case SendMode.all:
                await this.sendBroadcastMessage(FormData);
                await this.sendGroupMessage(FormData);
                break;
        }
    }

    private replyDefaultMessage = async (body: any) => {
        const replyToken = body.events[0].replyToken;
        await this.lineService.replyMessage(replyToken, 'お送り頂いたメッセージはどこにも送られないのでご注意ください');
    }
    
    async processRequest(): Promise<LambdaHttpResponse | FunctionsHttpResponse> {
        const sendMode = this.getSendMode();

        if(this.isNotifyServiceRequest()) {
            const bearerToken = this.getBearerToken();
    
            if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
                return this.httpUnAuthorizedErrorMessage('Invalid authorization token');
            }
    
            const formData = await this.messenger.getHttpFormDataAsync();
    
            await this.sendMessage(formData,sendMode);
            return this.httpOkMessage('Success Notify');
        }
    
        const body = JSON.parse(await this.messenger.getHttpBodyAsync());    

        /* health check from LINE */
        if(body.events.length === 0) {
            return this.httpOkMessage('No events');
        }

        /* if the request has group id, save group id */
        const groupId : string = this.getRequestGroupId(body);

        if(groupId !== "") {
            // リクエストにグループIDが含まれている場合、グループIDをデータストアに追加する
            await this.addGroupId(groupId);
            return this.httpOkMessage('Success Add Group');
        }

        /* reply default message */
        await this.replyDefaultMessage(body);
    
        return this.httpOkMessage('Success');
    }       
}