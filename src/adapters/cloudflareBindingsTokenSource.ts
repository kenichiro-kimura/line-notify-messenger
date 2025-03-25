/* eslint-disable @typescript-eslint/no-unused-vars */
import { ITokenSourceProvider } from "@interfaces/tokenSourceProvider";
import { TokenSourceBase } from "./tokenSourceBase";

/**
 * Cloudflare Workersの環境変数からトークンを取得するためのプロバイダークラス
 * Cloudflare Workersの環境変数にアクセスするためのインターフェースを実装
 */
class CloudflareBindingsProvider implements ITokenSourceProvider {
    private env: Env;
    
    /**
     * Cloudflare Workersの環境オブジェクトを受け取るコンストラクタ
     * @param env Cloudflare Workersの環境オブジェクト
     */
    constructor(env: Env) {
        this.env = env;
    }
    
    /**
     * Cloudflare Workersの環境変数から値を取得する
     * 注意: Cloudflare Workersの環境変数から値を取得するにはキー名を事前に固定しないといけないので、固定の値を返す
     * @param key 取得する環境変数のキー名（この実装では使用されない）
     * @returns 環境変数の値、もしくはundefined
     */
    getEnvValue(key: string): string | undefined {
        return this.env.AUTHORIZATION_TOKEN;
    }
    
    /**
     * 利用可能な環境変数のキー一覧を取得する
     * @returns 環境変数のキー名の配列
     */
    getEnvKeys(): string[] {
        return ['AUTHORIZATION_TOKEN'];
    }
}

/**
 * Cloudflare Workersの環境変数からトークンを取得するためのクラス
 * TokenSourceBaseを継承し、Cloudflare Workersの環境変数に特化した実装を提供
 */
export class CloudflareBindingsTokenSource extends TokenSourceBase {
    /**
     * @param env Cloudflare Workersの環境オブジェクト
     * @param prefix 環境変数のプレフィックス（デフォルトは'AUTHORIZATION_TOKEN'）
     */
    constructor(env: Env, prefix: string = 'AUTHORIZATION_TOKEN') {
        super(new CloudflareBindingsProvider(env), prefix);
    }
}