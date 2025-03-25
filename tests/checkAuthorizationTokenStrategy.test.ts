import { BaseAuthorizationTokenStrategy, MultiSourceAuthorizationTokenStrategy } from "../src/strategies/checkAuthorizationTokenStrategy";
import { ITokenSource } from "../src/interfaces/tokenSource";

// モックのトークンソースを作成
class MockTokenSource implements ITokenSource {
    constructor(private tokens: string[]) {}
    
    async getTokens(): Promise<string[]> {
        return this.tokens;
    }
}

describe("BaseAuthorizationTokenStrategy", () => {
    it("should work correctly with a single token source", async () => {
        const singleTokenSource = new MockTokenSource(["single_valid_token"]);
        const strategy = new MultiSourceAuthorizationTokenStrategy([singleTokenSource]);
        
        // 有効なトークンのテスト
        expect(await strategy.checkToken("single_valid_token")).toBe(true);
        
        // 無効なトークンのテスト
        expect(await strategy.checkToken("invalid_token")).toBe(false);
    });

    it("should handle a single token source that returns an empty array", async () => {
        const emptyTokenSource = new MockTokenSource([]);
        const strategy = new MultiSourceAuthorizationTokenStrategy([emptyTokenSource]);
        
        expect(await strategy.checkToken("any_token")).toBe(false);
    });

    it("should return true if the token is in the token source", async () => {
        const tokenSource = new MockTokenSource(["valid_token_1", "valid_token_2"]);
        const strategy = new BaseAuthorizationTokenStrategy(tokenSource);
        
        expect(await strategy.checkToken("valid_token_1")).toBe(true);
        expect(await strategy.checkToken("valid_token_2")).toBe(true);
    });

    it("should return false if the token is not in the token source", async () => {
        const tokenSource = new MockTokenSource(["valid_token_1", "valid_token_2"]);
        const strategy = new BaseAuthorizationTokenStrategy(tokenSource);
        
        expect(await strategy.checkToken("invalid_token")).toBe(false);
    });

    it("should return false if the token is undefined", async () => {
        const tokenSource = new MockTokenSource(["valid_token_1"]);
        const strategy = new BaseAuthorizationTokenStrategy(tokenSource);
        
        expect(await strategy.checkToken(undefined as unknown as string)).toBe(false);
    });

    it("should return false if the token is empty", async () => {
        const tokenSource = new MockTokenSource(["valid_token_1"]);
        const strategy = new BaseAuthorizationTokenStrategy(tokenSource);
        
        expect(await strategy.checkToken("")).toBe(false);
    });
});

describe("MultiSourceAuthorizationTokenStrategy", () => {
    it("should return true if the token is in any of the token sources", async () => {
        const tokenSource1 = new MockTokenSource(["valid_token_1"]);
        const tokenSource2 = new MockTokenSource(["valid_token_2"]);
        const strategy = new MultiSourceAuthorizationTokenStrategy([tokenSource1, tokenSource2]);
        
        expect(await strategy.checkToken("valid_token_1")).toBe(true);
        expect(await strategy.checkToken("valid_token_2")).toBe(true);
    });

    it("should return false if the token is not in any of the token sources", async () => {
        const tokenSource1 = new MockTokenSource(["valid_token_1"]);
        const tokenSource2 = new MockTokenSource(["valid_token_2"]);
        const strategy = new MultiSourceAuthorizationTokenStrategy([tokenSource1, tokenSource2]);
        
        expect(await strategy.checkToken("invalid_token")).toBe(false);
    });

    it("should return false if the token is undefined", async () => {
        const tokenSource1 = new MockTokenSource(["valid_token_1"]);
        const tokenSource2 = new MockTokenSource(["valid_token_2"]);
        const strategy = new MultiSourceAuthorizationTokenStrategy([tokenSource1, tokenSource2]);
        
        expect(await strategy.checkToken(undefined as unknown as string)).toBe(false);
    });

    it("should return false if the token is empty", async () => {
        const tokenSource1 = new MockTokenSource(["valid_token_1"]);
        const tokenSource2 = new MockTokenSource(["valid_token_2"]);
        const strategy = new MultiSourceAuthorizationTokenStrategy([tokenSource1, tokenSource2]);
        
        expect(await strategy.checkToken("")).toBe(false);
    });

    it("should return false if there are no token sources", async () => {
        const strategy = new MultiSourceAuthorizationTokenStrategy([]);
        
        expect(await strategy.checkToken("valid_token_1")).toBe(false);
    });

    it("should check each token source until it finds a match", async () => {
        // 実装してスパイを使用して呼び出し順序を確認するテスト
        const tokenSource1 = new MockTokenSource([]);
        const tokenSource2 = new MockTokenSource(["valid_token"]);
        
        // スパイを作成
        const getTokensSpy1 = jest.spyOn(tokenSource1, 'getTokens');
        const getTokensSpy2 = jest.spyOn(tokenSource2, 'getTokens');
        
        const strategy = new MultiSourceAuthorizationTokenStrategy([tokenSource1, tokenSource2]);
        
        expect(await strategy.checkToken("valid_token")).toBe(true);
        expect(getTokensSpy1).toHaveBeenCalled();
        expect(getTokensSpy2).toHaveBeenCalled();
    });
});
