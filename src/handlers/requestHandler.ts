/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { ILineNotifyMessenger } from '@interfaces/lineNotifyMessenger';
import { inject, injectable } from 'tsyringe';

@injectable()
export class RequestHandler {
    private messenger: ILineNotifyMessenger;

    constructor(
        @inject('ILineNotifyMessenger') messenger: ILineNotifyMessenger,
    ) {
        this.messenger = messenger;
    }

    getBearerToken(): string {
        return this.messenger.getHttpHeader('Authorization').split('Bearer ')[1] || '';
    }

    isNotifyServiceRequest(): boolean {
        const path = this.messenger.getHttpRequestPath();
        const method = this.messenger.getHttpMethod();
        const contentType = this.messenger.getHttpHeader('Content-Type');

        return (
            path === '/notify' &&
            method === 'POST' &&
            (contentType === 'application/x-www-form-urlencoded' || contentType.startsWith('multipart/form-data'))
        );
    }

    async getRequestBody(): Promise<any> {
        return JSON.parse(await this.messenger.getHttpBodyAsync());
    }

    async getFormData(): Promise<any> {
        return this.messenger.getHttpFormDataAsync();
    }
}