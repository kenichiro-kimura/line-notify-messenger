import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobImageStorage } from "../blobImageStorage";
import { JimpImageConverter } from "../jimpImageConverter";
import { FunctionsLineNotifyMessenger } from "../functionsLineNotifyMessenger";
import { LineNotifyMessengerApp } from "../lineNotifyMessengerApp";
import { FunctionsHttpResponse } from "../interfaces/lineNotifyMessenger";

export async function HttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Received request:', request);

    const messenger = new FunctionsLineNotifyMessenger(request);

    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const blobName = process.env.BLOB_NAME;
    const blobConnectionString = process.env.BLOB_CONNECTION_STRING;

    if (!blobName || !blobConnectionString) {
        throw new Error('BLOB_NAME or BLOB_CONNECTION_STRING is not set');
    }

    const app = new LineNotifyMessengerApp(messenger, lineChannelAccessToken, new BlobImageStorage(blobConnectionString,blobName), new JimpImageConverter());

    return await app.processRequest() as FunctionsHttpResponse;
}

app.http('HttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: HttpTrigger
});
app.http('HttpTriggerNotify', {
    methods: ['GET', 'POST'],
    route: 'HttpTrigger/notify',
    authLevel: 'anonymous',
    handler: HttpTrigger
});