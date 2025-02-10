import * as line from '@line/bot-sdk';

class LineService {
    private readonly client: line.messagingApi.MessagingApiClient;

    constructor(channelAccessToken: string) {
        this.client = new line.messagingApi.MessagingApiClient({ channelAccessToken });
    }

    public async sendMessage(to: string, message: string): Promise<void> {
        await this.client.pushMessage({
            to: to,
            messages: [{
                type: 'text',
                text: message
            }]
        });
    }

    public async replyMessage(replyToken: string, message: string): Promise<void> {
        await this.client.replyMessage({
            replyToken: replyToken,
            messages: [{
                type: 'text',
                text: message
            }]
        });
    }
}

export default LineService;