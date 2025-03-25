export interface ITokenSource {
    getTokens(): Promise<string[]>;
}