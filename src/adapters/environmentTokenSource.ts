import { ITokenSourceProvider } from "@interfaces/tokenSourceProvider";
import { TokenSourceBase } from "./tokenSourceBase";

/**
 * Node.jsの環境変数からトークンを取得するためのプロバイダークラス
 * process.envを利用して環境変数にアクセスするためのインターフェースを実装
 */
class NodeEnvironmentProvider implements ITokenSourceProvider {
    /**
     * Node.jsの環境変数から値を取得する
     * @param key 取得する環境変数のキー名
     * @returns 環境変数の値、もしくはundefined
     */
    getEnvValue(key: string): string | undefined {
        return process.env[key];
    }
    
    /**
     * 利用可能な環境変数のキー一覧を取得する
     * @returns 環境変数のキー名の配列
     */
    getEnvKeys(): string[] {
        return Object.keys(process.env);
    }
}

/**
 * Node.jsの環境変数からトークンを取得するためのクラス
 * TokenSourceBaseを継承し、Node.jsの環境変数に特化した実装を提供
 */
export class EnvironmentTokenSource extends TokenSourceBase {
    /**
     * @param prefix 環境変数のプレフィックス（デフォルトは'AUTHORIZATION_TOKEN'）
     */
    constructor(prefix: string = 'AUTHORIZATION_TOKEN') {
        super(new NodeEnvironmentProvider(), prefix);
    }
}
