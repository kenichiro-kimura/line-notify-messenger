import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { parse } from "querystring";
import LineService from "./lineService";
import { BlobImageStorage } from "./blobImageStorage";
import { JimpImageConverter } from "./jimpImageConverter";

const multipart = require('aws-lambda-multipart-parser');

const httpUnAuthorizedErrorMessage = (message: string) => {
    return {
        status: 401,
        body: { message }
    };
};

const httpInternalServerErrorMessage = (message: string) => {
    return {
        status: 500,
        body: { message }
    };
};

const httpOkMessage = (message: string) => {
    return {
        status: 200,
        body: { message }
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

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Received request:', req);

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        context.res = httpInternalServerErrorMessage('LINE_CHANNEL_ACCESS_TOKEN is not set');
        return;
    }

    const contentType = req.headers['content-type'] || req.headers['Content-Type'];
    const blobName = process.env.BLOB_NAME;

    if (!blobName) {
        context.res = httpInternalServerErrorMessage('BLOB_NAME is not set');
        return;
    }

    const lineService = new LineService(
        lineChannelAccessToken,
        new BlobImageStorage(blobName),
        new JimpImageConverter()
    );

    // notify イベントの場合
    if (isNotifyServiceRequest(req.url || "", req.method, contentType)) {
        const bearerToken = req.headers.authorization && req.headers.authorization.split('Bearer ')[1];
        if (!bearerToken || bearerToken !== process.env.AUTHORIZATION_TOKEN) {
            context.res = httpUnAuthorizedErrorMessage('Invalid authorization token');
            return;
        }

        let requestBody: string | Buffer = req.body;
        // Azure Functions では、body がBase64の場合はプロパティ req.isBase64Encoded に true が入るケースもあります
        if (req.isBase64Encoded) {
            requestBody = Buffer.from(req.body, 'base64').toString('binary');
        }

        let formData: any;
        if (contentType.startsWith('multipart/form-data')) {
            formData = multipart.parse(requestBody, true);
        } else {
            formData = parse(requestBody as string);
        }

        await sendBroadcastMessage(lineService, formData);
        context.res = httpOkMessage('Success Notify');
        return;
    }

    let body: any;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (error) {
        context.res = httpInternalServerErrorMessage('Invalid JSON in request body');
        return;
    }

    // LINE のヘルスチェックイベントの場合
    if (!body.events || body.events.length === 0) {
        context.res = httpOkMessage('No events');
        return;
    }

    // reply default message
    await replyDefaultMessage(lineService, body);
    context.res = httpOkMessage('Success');
};

export default httpTrigger;