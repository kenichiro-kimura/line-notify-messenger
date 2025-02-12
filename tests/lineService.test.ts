import LineService from "../src/lineService";
import * as line from '@line/bot-sdk';

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
        service = new LineService(dummyToken);
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
});