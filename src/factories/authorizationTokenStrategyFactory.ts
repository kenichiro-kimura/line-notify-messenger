import { ICheckAuthorizationToken } from '@interfaces/checkAuthorizationToken';
import { BaseAuthorizationTokenStrategy } from '../strategies/checkAuthorizationTokenStrategy';
import { EnvironmentTokenSource } from '@adapters/environmentTokenSource';
import { CloudflareBindingsTokenSource } from '@adapters/cloudflareBindingsTokenSource';

/**
 * 認証トークン検証戦略を生成するファクトリークラス
 * 異なる環境に応じた認証トークン検証戦略を提供する
 */
export class AuthorizationTokenStrategyFactory {
    /**
     * Node.js環境向けのデフォルト認証トークン検証戦略を生成する
     * 環境変数からトークンを取得して検証に使用する
     * @returns 認証トークン検証インターフェースの実装
     */
    static createDefaultStrategy(): ICheckAuthorizationToken {
        return new BaseAuthorizationTokenStrategy(
            new EnvironmentTokenSource()
        );
    }
    
    /**
     * Cloudflare Workers環境向けの認証トークン検証戦略を生成する
     * Cloudflareのバインディングからトークンを取得して検証に使用する
     * @param env Cloudflare Workersの環境オブジェクト
     * @returns 認証トークン検証インターフェースの実装
     */
    static createCloudflareBindingStrategy(env: Env): ICheckAuthorizationToken {
        return new BaseAuthorizationTokenStrategy(
            new CloudflareBindingsTokenSource(env)
        );
    }
}