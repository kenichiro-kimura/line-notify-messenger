/* eslint-disable  @typescript-eslint/no-explicit-any */
import * as line from '@line/bot-sdk';
import { IImageStorage } from '@interfaces/imageStorage';
import { IImageConverter } from '@interfaces/imageConverter';

class LineService {
    private readonly client: line.messagingApi.MessagingApiClient;
    private readonly imageStorage: IImageStorage;
    private readonly imageConverter: IImageConverter;

    constructor(channelAccessToken: string, imageStorage: IImageStorage, imageConverter: IImageConverter) {
        this.client = new line.messagingApi.MessagingApiClient({ channelAccessToken });        
        this.imageStorage = imageStorage;
        this.imageConverter = imageConverter;
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

    public async buildMessage(message: any): Promise<line.messagingApi.Message> {
        /*
        以下は line notifyの説明。
        
        message	必須	String	最大 1000文字
        imageThumbnail	省略可能	HTTPS URL	最大 240×240px / JPEG のみ許可されます(本制限は未実装)
        imageFullsize	省略可能	HTTPS URL	最大 2048×2048px / JPEG のみ許可されます(本制限は未実装)
        imageFile 	省略可能	File	
                    LINE上の画像サーバーにアップロードします。
                    対応している画像形式は、png, jpegです。
                    imageThumbnail/imageFullsizeと同時に指定された場合は、imageFileが優先されます。

                    (*)以下のRate Limitは現在は未実装
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
        if (message.imageFile) {
            // message.imageFile.contentType が 'image/jpeg' か 'image/png' であることを確認する
            if (!message.imageFile.contentType || !['image/jpeg', 'image/png'].includes(message.imageFile.contentType)) {
                throw new Error('Invalid image file type');
            }
            // imageFile が渡された場合、jimp を使って縮小したサムネイルとオリジナル画像をアップロードし、アクセスするURLを取得する
            // 一意なファイル名用のタイムスタンプ
            const timestamp = Date.now();
            const fileName = message.imageFile.filename.replace(/\./, "_");
            const suffix = message.imageFile.contentType === 'image/jpeg' ? 'jpg' : 'png';
            const originalKey = `original/${fileName}-${timestamp}.${suffix}`;
            const thumbnailKey = `thumbnail/${fileName}-${timestamp}.${suffix}`;

            // オリジナル画像をアップロード
            const originalUrl = await this.imageStorage.uploadImage(originalKey, message.imageFile.content, message.imageFile.contentType);

            // jimp により 240x240px 以内にリサイズ（縦横比を維持して内側にフィット）
            const thumbnailBuffer = await this.imageConverter.resizeImage(originalUrl, 240, 240, message.imageFile.contentType);

            // サムネイル画像をアップロード
            const thumbnailUrl = await this.imageStorage.uploadImage(thumbnailKey, thumbnailBuffer, message.imageFile.contentType);

            broadcastMessage = {
                type: 'image',
                originalContentUrl: originalUrl,
                previewImageUrl: thumbnailUrl
            } as line.ImageMessage;
        } else if (message.imageThumbnail && message.imageFullsize) {
            broadcastMessage = {
                type: 'image',
                originalContentUrl: message.imageFullsize,
                previewImageUrl: message.imageThumbnail
            } as line.ImageMessage;
        } else if (message.stickerPackageId && message.stickerId) {
            broadcastMessage = {
                type: 'sticker',
                packageId: message.stickerPackageId,
                stickerId: message.stickerId
            } as line.StickerMessage;
        } else {
            broadcastMessage = {
                type: 'text',
                text: message.message
            } as line.TextMessage;
        }

        return broadcastMessage;
    }

    public async groupMessage(groupIds: string[], message: string): Promise<void> {
        const groupMessage: line.messagingApi.Message = await this.buildMessage(message);
        for (const groupId of groupIds) {
            await this.client.pushMessage({
                to: groupId,
                messages: [
                    groupMessage
                ]
            });
        }
    }

    public async broadcastMessage(message: any): Promise<void> {
        const notificationDisabled: boolean = message.notificationDisabled || false;
        const broadcastMessage: line.messagingApi.Message = await this.buildMessage(message);        
        await this.client.broadcast({
            messages: [
                broadcastMessage
            ],
            notificationDisabled: notificationDisabled
        });
    }
}

export default LineService;