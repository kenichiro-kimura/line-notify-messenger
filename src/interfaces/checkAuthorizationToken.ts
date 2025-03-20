export interface ICheckAuthorizationToken {
    /**
     * 渡されたトークンが正当かどうかを検証する
     * @param token - 検証するトークン
     */
    checkToken(token: string): boolean;
}