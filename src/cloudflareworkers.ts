/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { LineNotifyMessengerApp } from '@core/lineNotifyMessengerApp';
import { CloudflareHttpRequestHandler } from '@handlers/cloudflareHttpRequestHandler';
import { IHttpRequestHandler } from '@interfaces/httpRequestHandler';

//interface Env {};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 環境変数のチェック
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    // Cloudflare コンテキストオブジェクトの登録
    const cloudflareHttpRequestHandler = new CloudflareHttpRequestHandler(request, env, ctx);
    
    // Tsyringeで依存関係を登録
    container.registerInstance('LineChannelAccessToken', lineChannelAccessToken);
    container.registerInstance<IHttpRequestHandler>('IHttpRequestHandler', cloudflareHttpRequestHandler);

    // TsyringeでLineNotifyMessengerAppを解決
    const app = container.resolve(LineNotifyMessengerApp);

    return await app.processRequest() as Response;
  },
} satisfies ExportedHandler<Env>;