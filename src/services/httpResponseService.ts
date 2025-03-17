import { FunctionsHttpResponse, ILineNotifyMessenger, LambdaHttpResponse } from '@interfaces/lineNotifyMessenger';

export class HttpResponseService {
    private messenger: ILineNotifyMessenger;

    constructor(messenger: ILineNotifyMessenger) {
        this.messenger = messenger;
    }

    httpUnAuthorizedErrorMessage(message: string): LambdaHttpResponse | FunctionsHttpResponse {
        return this.messenger.buildHttpResponse(401, message);
    }

    httpInternalServerErrorMessage(message: string): LambdaHttpResponse | FunctionsHttpResponse {
        return this.messenger.buildHttpResponse(500, message);
    }

    httpOkMessage(message: string): LambdaHttpResponse | FunctionsHttpResponse {
        return this.messenger.buildHttpResponse(200, message);
    }
}
