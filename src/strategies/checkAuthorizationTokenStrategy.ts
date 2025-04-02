import { ICheckAuthorizationToken } from "@interfaces/checkAuthorizationToken";
import { ITokenSource } from "@interfaces/tokenSource";
export class BaseAuthorizationTokenStrategy implements ICheckAuthorizationToken {
    constructor(private tokenSource: ITokenSource) {}
    
    async checkToken(token: string): Promise<boolean> {
        if (!token) return false;
        const validTokens = await this.tokenSource.getTokens();
        return validTokens.includes(token);
    }
}

export class MultiSourceAuthorizationTokenStrategy implements ICheckAuthorizationToken {
    constructor(private tokenSources: ITokenSource[]) {}
    
    async checkToken(token: string): Promise<boolean> {
        if (!token) return false;
        
        for (const source of this.tokenSources) {
            const validTokens = await source.getTokens();
            if (validTokens.includes(token)) return true;
        }
        
        return false;
    }
}