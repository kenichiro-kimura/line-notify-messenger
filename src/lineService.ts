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

    public async broadcastMessage(message: any): Promise<void> {
        /*
        以下は line notifyの説明。このうち、imageFileは未対応なので、imageThumbnailとimageFullsizeを使う。
        
        message	必須	String	最大 1000文字
        imageThumbnail	省略可能	HTTPS URL	最大 240×240px / JPEG のみ許可されます
        imageFullsize	省略可能	HTTPS URL	最大 2048×2048px / JPEG のみ許可されます
        imageFile(未対応) 	省略可能	File	
                    LINE上の画像サーバーにアップロードします。
                    対応している画像形式は、png, jpegです。
                    imageThumbnail/imageFullsizeと同時に指定された場合は、imageFileが優先されます。

        1時間にuploadできる量に制限があります。
        詳しくは、API Rate Limitの項を見てください。

        stickerPackageId	省略可能	Number	パッケージ識別子。
                Stickerの識別子は以下を参照ください。
                https://developers.line.biz/ja/docs/messaging-api/sticker-list/
        stickerId	省略可能	Number	Sticker識別子
        notificationDisabled省略可能	Boolean	
            true: メッセージ送信時に、ユーザに通知されない。
            false: メッセージ送信時に、ユーザに通知される。ただし、LINEで通知をオフにしている場合は通知されません。
            デフォルト値は false です。
        */
        let broadcastMessage: line.Message;
        const notificationDisabled = message.notificationDisabled || false;
        if (message.imageThumbnail && message.imageFullsize) {
            broadcastMessage = {
                type: 'image',
                originalContentUrl: message.imageFullsize,
                previewImageUrl: message.imageThumbnail
            };
        } else if (message.stickerPackageId && message.stickerId) {
            broadcastMessage = {
                type: 'sticker',
                packageId: message.stickerPackageId,
                stickerId: message.stickerId
            };
        } else {
            broadcastMessage = {
                type: 'text',
                text: message.message
            };
        }

        await this.client.broadcast({
            messages: [
                broadcastMessage
            ],
            notificationDisabled: notificationDisabled
        });
    }
}

export default LineService;