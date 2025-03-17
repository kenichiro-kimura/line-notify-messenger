/* eslint-disable  @typescript-eslint/no-explicit-any */
import { SendMode } from '../interfaces/sendModeStrategy';
import LineService from '../lineService';
import { GroupService } from './groupService';
import { ISendModeStrategy } from '../interfaces/sendModeStrategy';

export class MessageService {
    private lineService: LineService;
    private groupService: GroupService;
    private sendModeStrategy: ISendModeStrategy;

    constructor(lineService: LineService, groupService: GroupService, sendModeStrategy: ISendModeStrategy) {
        this.lineService = lineService;
        this.groupService = groupService;
        this.sendModeStrategy = sendModeStrategy;
    }

    getSendMode(): SendMode {
        return this.sendModeStrategy.getSendMode();
    }

    private async sendBroadcastMessage(formData: any): Promise<void> {
        await this.lineService.broadcastMessage(formData);
    }

    private async sendGroupMessage(formData: any): Promise<void> {
        const groupIds: string[] = await this.groupService.getTargetGroupIds();
        console.log(`groupIds: ${groupIds}`);
        if (groupIds.length > 0) {
            await this.lineService.groupMessage(groupIds, formData);
        }
    }

    async sendMessage(formData: any): Promise<void> {
        const sendMode: SendMode = this.getSendMode();
        switch (sendMode) {
            case SendMode.broadcast:
                await this.sendBroadcastMessage(formData);
                break;
            case SendMode.group:
                await this.sendGroupMessage(formData);
                break;
            case SendMode.all:
                await this.sendBroadcastMessage(formData);
                await this.sendGroupMessage(formData);
                break;
        }
    }

    async replyDefaultMessage(body: any): Promise<void> {
        const replyToken = body.events[0].replyToken;
        await this.lineService.replyMessage(
            replyToken,
            'お送り頂いたメッセージはどこにも送られないのでご注意ください'
        );
    }
}
