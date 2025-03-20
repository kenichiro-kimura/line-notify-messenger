import { ICheckAuthorizationToken } from "@interfaces/checkAuthorizationToken";

/**
 * 認証トークンが正当かどうかを検証するストラテジーの実装クラス
 * 環境変数AUTHORIZATION_TOKENと一致するかをを返します
 */
export class DefaultCheckAuthorizationTokenStrategy implements ICheckAuthorizationToken {
    /**
     * デフォルトではAUTHORIZATION_TOKEN環境変数と一致するかをチェックします
     * @returns トークンが定義されていて、環境変数と一致するかどうか
     */
    checkToken(token: string) : boolean {
        if (token) {
            return token === process.env.AUTHORIZATION_TOKEN;
        } else {
            return false;
        }
    }
}

export class MultipleEnvironmentCheckAuthorizationTokenStrategy implements ICheckAuthorizationToken {
    /**
     * "AUTHORIZATION_TOKEN"という文字列で始まる全ての環境変数のいずれかと一致するかをチェックします
     * @returns トークンが定義されていて、環境変数と一致するかどうか
     */
    checkToken(token: string) : boolean {
        if (token) {
            const keys = Object.keys(process.env);
            const tokenKeys = keys.filter(key => key.startsWith('AUTHORIZATION_TOKEN'));
            return tokenKeys.some(key => token === process.env[key]);
        } else {
            return false;
        }
    }
}