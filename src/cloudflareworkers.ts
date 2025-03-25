/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { LineNotifyMessengerApp } from '@core/lineNotifyMessengerApp';
import { CloudflareHttpRequestHandler } from '@handlers/cloudflareHttpRequestHandler';
import { IHttpRequestHandler } from '@interfaces/httpRequestHandler';
import { IImageConverter } from '@interfaces/imageConverter';
import { R2ImageStorage } from '@repositories/r2ImageStorage';
import { JimpImageConverter } from '@utils/jimpImageConverter';
import { IGroupRepository } from '@interfaces/groupRepository';
import { KVGroupRepository } from '@repositories/kvGroupRepository';
import { BindingSendModeStrategy } from '@strategies/sendModeStrategy';
import { ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { IImageStorage } from '@interfaces/imageStorage';
import LineService from '@services/lineService';

//interface Env {};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 環境変数のチェック
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!lineChannelAccessToken) {
        throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    const kvNamespace: KVNamespace<string> = env.GROUPS;

    const r2Bucket: R2Bucket = env.IMAGES;

    // workersのURLを取得
    const url = new URL(request.url);
    const origin = url.origin;

    const cloudflareHttpRequestHandler = new CloudflareHttpRequestHandler(request, env, ctx);    
    const r2ImageStorage = new R2ImageStorage(r2Bucket, origin);
    const bindingSendModeStrategy = new BindingSendModeStrategy(env);

    // Tsyringeで依存関係を登録
    container.registerInstance('LineChannelAccessToken', lineChannelAccessToken);
    container.registerInstance('AuthorizationToken', env.AUTHORIZATION_TOKEN);
    container.registerInstance<IImageStorage>('IImageStorage', r2ImageStorage);
    container.register<IImageConverter>('IImageConverter', JimpImageConverter);
    container.registerInstance<IGroupRepository>('IGroupRepository', new KVGroupRepository(kvNamespace));
    container.registerInstance<IHttpRequestHandler>('IHttpRequestHandler', cloudflareHttpRequestHandler);
    container.registerInstance<ISendModeStrategy>('ISendModeStrategy', bindingSendModeStrategy);
    container.register('LineService', { useClass: LineService });
 
    // TsyringeでLineNotifyMessengerAppを解決
    const app = container.resolve(LineNotifyMessengerApp);

    // 画像のURLの場合は画像を返す
		if (url.pathname.startsWith("/images/")) {
			const object = await r2Bucket.get(url.pathname.replace("/images/", ""));
			if (object === null) {
				return new Response("Object Not Found", { status: 404 });
			}

			const headers = new Headers();
			object.writeHttpMetadata(headers);
			headers.set("etag", object.httpEtag);

      // R2Objectからレスポンスを作成して返す
			return new Response(object.body, {
				headers,
			});
		}

    return await app.processRequest() as Response;
  },
} satisfies ExportedHandler<Env>;