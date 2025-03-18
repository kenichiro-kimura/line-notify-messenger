import 'reflect-metadata';
import { FunctionsHttpResponse, ILineNotifyMessenger, LambdaHttpResponse } from '@interfaces/lineNotifyMessenger';
import { inject, injectable } from 'tsyringe';

@injectable()
export class HttpResponseService {
    private messenger: ILineNotifyMessenger;

    constructor(
        @inject('ILineNotifyMessenger') messenger: ILineNotifyMessenger,
    ) {
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
