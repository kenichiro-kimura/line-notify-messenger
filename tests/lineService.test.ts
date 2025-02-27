import LineService from "../src/lineService";
const pushMessageMock = jest.fn().mockResolvedValue(undefined);
const replyMessageMock = jest.fn().mockResolvedValue(undefined);
const broadcastMock = jest.fn().mockResolvedValue(undefined);

// MessagingApiClient をモック化
jest.mock('@line/bot-sdk', () => {
    return {
        messagingApi: {
            MessagingApiClient: jest.fn().mockImplementation(() => ({
                pushMessage: pushMessageMock,
                replyMessage: replyMessageMock,
                // broadcastMessage 関数として broadcast を用いる場合
                broadcast: broadcastMock,
            }))
        }
    };
});

describe("LineService", () => {
    const dummyToken = 'dummy_channel_access_token';
    let service: LineService;

    beforeEach(() => {
        jest.clearAllMocks();
        const imageStorageMock = {
            uploadImage: jest.fn().mockResolvedValue('https://example.com/saved-image.jpg')
        };
        const imageConverterMock = {
            resizeImage: jest.fn()
        };
        service = new LineService(dummyToken, imageStorageMock, imageConverterMock);
    });

    test("sendMessage should call pushMessage with correct arguments", async () => {
        const to = 'USER_ID';
        const message = 'Hello';
        await service.sendMessage(to, message);

        expect(pushMessageMock).toHaveBeenCalledTimes(1);
        expect(pushMessageMock).toHaveBeenCalledWith({
            to: to,
            messages: [{
                type: 'text',
                text: message
            }]
        });
    });

    test("replyMessage should call replyMessage with correct arguments", async () => {
        const replyToken = 'dummyReplyToken';
        const message = 'こんにちは';
        await service.replyMessage(replyToken, message);

        expect(replyMessageMock).toHaveBeenCalledTimes(1);
        expect(replyMessageMock).toHaveBeenCalledWith({
            replyToken: replyToken,
            messages: [{
                type: 'text',
                text: message
            }]
        });
    });

    test("broadcastMessage should call broadcast with correct text message", async () => {
        const expectedBroadcastContent = { type: 'text', text: 'Broadcast message' };
        const broadcastContent = { message: 'Broadcast message'} ;
        await service.broadcastMessage(broadcastContent);

        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [expectedBroadcastContent],
            notificationDisabled: false
        });
    });

    test("broadcastMessage should call broadcast with correct image message", async () => {
        const expectedBroadcastContent = {
            type: 'image',
            originalContentUrl: 'https://example.com/original.jpg',
            previewImageUrl: 'https://example.com/preview.jpg'
        };
        const broadcastContent = {
            message: 'Broadcast message',
            imageThumbnail: 'https://example.com/preview.jpg',
            imageFullsize: 'https://example.com/original.jpg'
        };
        await service.broadcastMessage(broadcastContent);

        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [expectedBroadcastContent],
            notificationDisabled: false
        });
    });

    test("broadcastMessage should call broadcast with correct sticker message", async () => {
        const expectedBroadcastContent = {
            type: 'sticker',
            packageId: '1',
            stickerId: '1'
        };
        const broadcastContent = {
            message: 'Broadcast message',
            stickerPackageId: '1',
            stickerId: '1'
        };
        await service.broadcastMessage(broadcastContent);

        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [expectedBroadcastContent],
            notificationDisabled: false
        });
    });

    test("broadcastMessage should call broadcast with text message and default notificationDisabled (false) when not specified", async () => {
        const expectedBroadcastContent = { type: 'text', text: 'Broadcast message' };
        const broadcastContent = { message: 'Broadcast message' };
        await service.broadcastMessage(broadcastContent);

        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [expectedBroadcastContent],
            notificationDisabled: false
        });
    });

    test("broadcastMessage should call broadcast with text message and notificationDisabled equals true when specified", async () => {
        const expectedBroadcastContent = { type: 'text', text: 'Broadcast message' };
        const broadcastContent = { message: 'Broadcast message', notificationDisabled: true };
        await service.broadcastMessage(broadcastContent);

        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [expectedBroadcastContent],
            notificationDisabled: true
        });
    });

    test("broadcastMessage should call broadcast with text message and notificationDisabled equals false when specified", async () => {
        const expectedBroadcastContent = { type: 'text', text: 'Broadcast message' };
        const broadcastContent = { message: 'Broadcast message', notificationDisabled: false };
        await service.broadcastMessage(broadcastContent);

        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [expectedBroadcastContent],
            notificationDisabled: false
        });
    });

    test("broadcastMessage should call broadcast with correct image message when imageFile is provided", async () => {
        const expectedOriginalUrl = "https://example.com/original.jpg";
        const expectedThumbnailUrl = "https://example.com/thumbnail.jpg";

        const imageFile = {
            filename: "test.jpg",
            content: Buffer.from("test image content"),
            contentType: "image/jpeg"
        };

        // uploadImage モック: originalKey が "original/" で始まるとき、originalUrl を返し、
        // thumbnailKey が "thumbnail/" で始まるとき、thumbnailUrl を返す
        const imageStorageMock = {
            uploadImage: jest.fn().mockImplementation((key: string): Promise<string> => {
                if (key.startsWith("original/")) {
                    return Promise.resolve(expectedOriginalUrl);
                }
                if (key.startsWith("thumbnail/")) {
                    return Promise.resolve(expectedThumbnailUrl);
                }
                return Promise.resolve("");
            })
        };

        // resizeImage モックは、単に Buffer を返す
        const imageConverterMock = {
            resizeImage: jest.fn().mockResolvedValue(Buffer.from("resized image content"))
        };

        // 新たな LineService をインスタンス化
        service = new LineService(dummyToken, imageStorageMock, imageConverterMock);

        const broadcastContent = {
            message: "Broadcast message",
            imageFile: imageFile
        };
        await service.broadcastMessage(broadcastContent);

        // uploadImage は元画像とサムネイル画像のアップロードで2回呼ばれるはず
        expect(imageStorageMock.uploadImage).toHaveBeenCalledTimes(2);
        // resizeImage が originalUrl, 240, 240, contentType で呼ばれていることを確認
        expect(imageConverterMock.resizeImage).toHaveBeenCalledWith(expectedOriginalUrl, 240, 240, imageFile.contentType);
        expect(broadcastMock).toHaveBeenCalledTimes(1);
        expect(broadcastMock).toHaveBeenCalledWith({
            messages: [{
                type: 'image',
                originalContentUrl: expectedOriginalUrl,
                previewImageUrl: expectedThumbnailUrl
            }],
            notificationDisabled: false
        });
    });
});