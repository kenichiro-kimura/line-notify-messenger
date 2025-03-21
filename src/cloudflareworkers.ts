/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { LineNotifyMessengerApp } from '@core/lineNotifyMessengerApp';

//interface Env {};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 環境変数のチェック
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    // Tsyringeで依存関係を登録
    container.registerInstance('LineChannelAccessToken', lineChannelAccessToken);

   // TsyringeでLineNotifyMessengerAppを解決
   const app = container.resolve(LineNotifyMessengerApp);

   return await app.processRequest() as unknown as Response;// as CloudflareWorkerResponse;
  },
} satisfies ExportedHandler<Env>;