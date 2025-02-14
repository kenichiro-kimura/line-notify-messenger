import { parse } from 'querystring';
import LineService from './lineService';
const multipart = require('aws-lambda-multipart-parser');

const httpUnAuthorizedErrorMessage = (message: string) => {
    return {
        statusCode: 401,
        body: JSON.stringify({ message: message }),
    };
};

const httpInternalServerErrorMessage = (message: string) => {
    return {
        statusCode: 500,
        body: JSON.stringify({ message:message }),
    };
};

const httpOkMessage = (message: string) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: message }),
    };
};

const isNotifyServiceRequest = (path: string,method: string, contentType: string): boolean => {
    if(path === '/notify' && method === 'POST' && ( contentType === 'application/x-www-form-urlencoded' || contentType.startsWith('multipart/form-data'))) {
        return true;
    }
    return false;
};

const sendBroadcastMessage = async (lineService: LineService,formData: any) => {
    await lineService.broadcastMessage(formData);
};

const replyDefaultMessage = async (lineService: LineService, body: any) => {
    const replyToken = body.events[0].replyToken;
    await lineService.replyMessage(replyToken, 'お送り頂いたメッセージはどこにも送られないのでご注意ください');
};

export const handler = async (event: any) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        return httpInternalServerErrorMessage('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    /* notify event */
    const contentType = event.headers?.['content-type'] || event.headers?.['Content-Type'];
    const lineService = new LineService(lineChannelAccessToken);

    if(isNotifyServiceRequest(event.rawPath, event.requestContext?.http?.method, contentType)) {
        const bearerToken = event.headers?.authorization?.split('Bearer ')[1];

        if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
            return httpUnAuthorizedErrorMessage('Invalid authorization token');
        }

        if (event.isBase64Encoded === true){
            event.body = Buffer.from(event.body, 'base64').toString('binary');
        }

        let formData;

        if (contentType.startsWith('multipart/form-data')) {
            formData = multipart.parse(event,true);
        } else {
            formData = parse(event.body);
        }
        await sendBroadcastMessage(lineService,formData,contentType);
        return httpOkMessage('Success Notify');
    }

    const body = JSON.parse(event.body);

    /* health check from LINE */
    if(body.events.length === 0) {
        return httpOkMessage('No events');
    }

    /* reply default message */
    await replyDefaultMessage(lineService, body);

    return httpOkMessage('Success');
};
