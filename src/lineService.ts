import * as line from '@line/bot-sdk';
import { ImageStorage } from '../interfaces/imageStorage';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Jimp } from 'jimp';

class LineService {
    private readonly client: line.messagingApi.MessagingApiClient;
    private readonly imageStorage: ImageStorage;
    constructor(channelAccessToken: string, imageStorage: ImageStorage) {
        this.client = new line.messagingApi.MessagingApiClient({ channelAccessToken });
        this.imageStorage = imageStorage;
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
        } else if (message.imageFile) {
            // imageFile が渡された場合、jimp を使って縮小したサムネイルとオリジナル画像をアップロードし、アクセスするURLを取得する
            // 一意なファイル名用のタイムスタンプ
            const timestamp = Date.now();
            const fileName = message.imageFile.filename.replace(/\./, "_");
            const originalKey = `original/${fileName}-${timestamp}.jpg`;
            const thumbnailKey = `thumbnail/${fileName}-${timestamp}.jpg`;

            // オリジナル画像をアップロード
            const originalUrl = await this.imageStorage.uploadImage(originalKey, message.imageFile.content, message.imageFile.contentType);

            // jimp により 240x240px 以内にリサイズ（縦横比を維持して内側にフィット）
            const image = await Jimp.read(originalUrl);
            const imageWidth = image.width;
            const imageHeight = image.height;
            if (imageWidth > 240 || imageHeight > 240) {
                if (imageWidth > imageHeight) {
                    image.resize({ w:240 });
                } else {
                    image.resize({ h:240 });
                }
            }
            const thumbnailBuffer = await image.getBuffer("image/jpeg");

            // サムネイル画像を S3 にアップロード
            const thumbnailUrl = await this.imageStorage.uploadImage(thumbnailKey, thumbnailBuffer, 'image/jpeg');

            broadcastMessage = {
                type: 'image',
                originalContentUrl: originalUrl,
                previewImageUrl: thumbnailUrl
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