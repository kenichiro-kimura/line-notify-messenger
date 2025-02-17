import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parse } from "querystring";
import LineService from "../lineService";
import { BlobImageStorage } from "../blobImageStorage";
import { JimpImageConverter } from "../jimpImageConverter";

const multipart = require('aws-lambda-multipart-parser');

const httpUnAuthorizedErrorMessage = (message: string) => {
    return {
        status: 401,
        body: message
    };
};

const httpInternalServerErrorMessage = (message: string) => {
    return {
        status: 500,
        body: message
    };
};

const httpOkMessage = (message: string) => {
    return {
        status: 200,
        body: message
    };
};

const isNotifyServiceRequest = (path: string, method: string, contentType: string): boolean => {
    if (path === '/notify' && method === 'POST' &&
        (contentType === 'application/x-www-form-urlencoded' || contentType.startsWith('multipart/form-data'))) {
        return true;
    }
    return false;
};

const sendBroadcastMessage = async (lineService: LineService, formData: any) => {
    await lineService.broadcastMessage(formData);
};

const replyDefaultMessage = async (lineService: LineService, body: any) => {
    const replyToken = body.events[0].replyToken;
    await lineService.replyMessage(replyToken, 'お送り頂いたメッセージはどこにも送られないのでご注意ください');
};

export async function HttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Received request:', request);

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        return  httpInternalServerErrorMessage('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const contentType = request.headers['content-type'] || request.headers['Content-Type'];
    const blobName = process.env.BLOB_NAME;

    if (!blobName) {
        return httpInternalServerErrorMessage('BLOB_NAME is not set');
    }

    const lineService = new LineService(
        lineChannelAccessToken,
        new BlobImageStorage(blobName),
        new JimpImageConverter()
    );

    // notify イベントの場合
    if (isNotifyServiceRequest(request.url || "", request.method, contentType)) {
        const bearerToken = request.headers['Authorization'] && request.headers['Authorization'].split('Bearer ')[1];
        if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
            return httpUnAuthorizedErrorMessage('Invalid authorization token');
        }

        let formData: any;
        if (contentType.startsWith('multipart/form-data')) {
            formData = await request.formData();
        } else {
            formData = await request.json();
        }

        await sendBroadcastMessage(lineService, formData);
        return httpOkMessage('Success Notify');
    }

    const body = await request.text();
    let jsonBody;
    try {
        jsonBody = JSON.parse(body);
    } catch (error) {
        return httpOkMessage('Success');
    }

    // LINE のヘルスチェックイベントの場合
    if(jsonBody.events.length === 0) {
        return httpOkMessage('Success');
    }

    // reply default message
    await replyDefaultMessage(lineService, jsonBody);
    return httpOkMessage('Success');
};

app.http('HttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: HttpTrigger
});