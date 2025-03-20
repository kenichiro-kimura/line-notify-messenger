import { ICheckAuthorizationToken } from "@interfaces/checkAuthorizationToken";

/**
 * 認証トークンが正当かどうかを検証するストラテジーの実装クラス
 * 環境変数AUTHORIZATION_TOKENと一致するかをを返します
 */
export class DefaultCheckAuthorizationTokenStrategy implements ICheckAuthorizationToken {
    /**
     * ブロードキャスト送信モードを常に返します
     * @returns ブロードキャスト送信モード（SendMode.broadcast）
     */
    checkToken(token: string) : boolean {
        if (token) {
            return token === process.env.AUTHORIZATION_TOKEN;
        } else {
            return false;
        }
    }
}

