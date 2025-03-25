import { ITokenSource } from "@interfaces/tokenSource";
import { ITokenSourceProvider } from "@interfaces/tokenSourceProvider";

/**
 * トークン取得の基本機能を提供する抽象基底クラス
 * 様々な環境（Node.js、Cloudflare Workersなど）からトークンを取得するための共通実装を提供
 */
export abstract class TokenSourceBase implements ITokenSource {
    /**
     * 環境変数へのアクセスを提供するプロバイダー
     */
    protected provider: ITokenSourceProvider;
    
    /**
     * 環境変数のプレフィックス
     * このプレフィックスを持つ環境変数からトークンを取得する
     */
    protected prefix: string;

    /**
     * TokenSourceBaseのコンストラクタ
     * @param provider 環境変数アクセスを提供するプロバイダー
     * @param prefix 環境変数のプレフィックス（デフォルトは'AUTHORIZATION_TOKEN'）
     */
    constructor(provider: ITokenSourceProvider, prefix: string = 'AUTHORIZATION_TOKEN') {
        this.provider = provider;
        this.prefix = prefix;
    }
    
    /**
     * 設定されたプレフィックスに基づいて利用可能なすべてのトークンを取得する
     * 環境変数がプレフィックスと完全一致、またはプレフィックス_で始まる場合にトークンとして認識
     * @returns 取得したトークンの配列
     */
    async getTokens(): Promise<string[]> {
        const keys = this.provider.getEnvKeys();
        const tokenKeys = keys.filter(key => 
            key === this.prefix || key.startsWith(`${this.prefix}_`));
        return tokenKeys
            .map(key => this.provider.getEnvValue(key))
            .filter(token => token !== undefined) as string[];
    }
}
