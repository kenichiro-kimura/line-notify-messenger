import LineService from './lineService';

export const handler = async (event: any) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const body = JSON.parse(event.body);
    const replyToken = body.events[0].replyToken;
    const message = body.events[0].message.text;

    // LINE Messaging APIとのインタラクションを行うサービスをインポート
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not defined');
    }
    const lineService = new LineService(lineChannelAccessToken);

    // メッセージに応じた処理を実行
    if (message === 'こんにちは') {
        await lineService.replyMessage(replyToken, 'こんにちは！');
    } else {
        await lineService.replyMessage(replyToken, 'メッセージを受け取りました。');
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Success' }),
    };
};
