import { DefaultCheckAuthorizationTokenStrategy, MultipleEnvironmentCheckAuthorizationTokenStrategy } from "../src/strategies/checkAuthorizationTokenStrategy";

describe("DefaultCheckAuthorizationTokenStrategy", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("should return true if the token matches the AUTHORIZATION_TOKEN environment variable", () => {
        process.env.AUTHORIZATION_TOKEN = "valid_token";
        const strategy = new DefaultCheckAuthorizationTokenStrategy();
        expect(strategy.checkToken("valid_token")).toBe(true);
    });

    it("should return false if the token does not match the AUTHORIZATION_TOKEN environment variable", () => {
        process.env.AUTHORIZATION_TOKEN = "valid_token";
        const strategy = new DefaultCheckAuthorizationTokenStrategy();
        expect(strategy.checkToken("invalid_token")).toBe(false);
    });

    it("should return false if the token is undefined", () => {
        process.env.AUTHORIZATION_TOKEN = "valid_token";
        const strategy = new DefaultCheckAuthorizationTokenStrategy();
        expect(strategy.checkToken(undefined as unknown as string)).toBe(false);
    });
});

describe("MultipleEnvironmentCheckAuthorizationTokenStrategy", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("should return true if the token matches any AUTHORIZATION_TOKEN* environment variable", () => {
        process.env.AUTHORIZATION_TOKEN_1 = "valid_token_1";
        process.env.AUTHORIZATION_TOKEN_2 = "valid_token_2";
        const strategy = new MultipleEnvironmentCheckAuthorizationTokenStrategy();
        expect(strategy.checkToken("valid_token_1")).toBe(true);
        expect(strategy.checkToken("valid_token_2")).toBe(true);
    });

    it("should return false if the token does not match any AUTHORIZATION_TOKEN* environment variable", () => {
        process.env.AUTHORIZATION_TOKEN_1 = "valid_token_1";
        process.env.AUTHORIZATION_TOKEN_2 = "valid_token_2";
        const strategy = new MultipleEnvironmentCheckAuthorizationTokenStrategy();
        expect(strategy.checkToken("invalid_token")).toBe(false);
    });

    it("should return false if the token is undefined", () => {
        process.env.AUTHORIZATION_TOKEN_1 = "valid_token_1";
        const strategy = new MultipleEnvironmentCheckAuthorizationTokenStrategy();
        expect(strategy.checkToken(undefined as unknown as string)).toBe(false);
    });
});
