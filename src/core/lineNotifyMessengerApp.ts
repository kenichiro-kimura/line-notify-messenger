/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { FunctionsHttpResponse, ILineNotifyMessenger, LambdaHttpResponse } from '@interfaces/lineNotifyMessenger';
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';
import LineService from '@services/lineService';
import { IGroupRepository } from '@interfaces/groupRepository';
import { SendMode, ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { RequestHandler } from '@handlers/requestHandler';
import { inject, injectable } from 'tsyringe';

@injectable()
export class LineNotifyMessengerApp {
    private messenger: ILineNotifyMessenger;
    private lineService: LineService;
    private groupRepository: IGroupRepository;
    private sendModeStrategy: ISendModeStrategy;
    private requestHandler: RequestHandler;

    constructor(
        @inject('ILineNotifyMessenger') messenger: ILineNotifyMessenger,
        @inject('LineChannelAccessToken') lineChannelAccessToken: string,
        @inject('IImageStorage') imageStorage: IImageStorage,
        @inject('IImageConverter') imageConverter: IImageConverter,
        @inject('IGroupRepository') groupRepository: IGroupRepository,
        @inject('ISendModeStrategy') sendModeStrategy: ISendModeStrategy,
        @inject('LineService') lineService: LineService,
    ) {
        this.messenger = messenger;
        this.lineService = lineService;
        this.groupRepository = groupRepository;
        this.sendModeStrategy = sendModeStrategy;
        this.requestHandler = new RequestHandler(messenger); // RequestHandler を初期化
    }
    
    private httpUnAuthorizedErrorMessage = (message: string): LambdaHttpResponse | FunctionsHttpResponse => {
        return this.messenger.buildHttpResponse(401, message);
    };

    private httpInternalServerErrorMessage = (message: string): LambdaHttpResponse | FunctionsHttpResponse => {
        return this.messenger.buildHttpResponse(500, message);
    };

    private httpOkMessage = (message: string): LambdaHttpResponse | FunctionsHttpResponse => {
        return this.messenger.buildHttpResponse(200, message);
    };

    private getRequestGroupId = (body: any): string => {
        return body.events[0]?.source?.groupId || '';
    };

    private addGroupId = async (groupId: string) => {
        await this.groupRepository.add(groupId);
    };

    private getTargetGroupIds = async (): Promise<string[]> => {
        return this.groupRepository.listAll();
    };

    private sendBroadcastMessage = async (formData: any) => {
        await this.lineService.broadcastMessage(formData);
    };

    private sendGroupMessage = async (formData: any) => {
        const groupIds: string[] = await this.getTargetGroupIds();
        console.log(`groupIds: ${groupIds}`);
        if (groupIds.length > 0) {
            await this.lineService.groupMessage(groupIds, formData);
        }
    };

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
    };

    private replyDefaultMessage = async (body: any) => {
        const replyToken = body.events[0].replyToken;
        await this.lineService.replyMessage(
            replyToken,
            'お送り頂いたメッセージはどこにも送られないのでご注意ください'
        );
    };

    private getSendMode = (): SendMode => {
        return this.sendModeStrategy.getSendMode();
    };

    async processRequest(): Promise<LambdaHttpResponse | FunctionsHttpResponse> {
        const sendMode = this.getSendMode();

        if (this.requestHandler.isNotifyServiceRequest()) {
            const bearerToken = this.requestHandler.getBearerToken();

            if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
                return this.httpUnAuthorizedErrorMessage('Invalid authorization token');
            }

            const formData = await this.requestHandler.getFormData();

            await this.sendMessage(formData, sendMode);
            return this.httpOkMessage('Success Notify');
        }

        const body = await this.requestHandler.getRequestBody();

        /* health check from LINE */
        if (body.events.length === 0) {
            return this.httpOkMessage('No events');
        }

        /* if the request has group id, save group id */
        const groupId: string = this.getRequestGroupId(body);

        if (groupId !== '') {
            await this.addGroupId(groupId);
            return this.httpOkMessage('Success Add Group');
        }

        /* reply default message */
        await this.replyDefaultMessage(body);

        return this.httpOkMessage('Success');
    }
}