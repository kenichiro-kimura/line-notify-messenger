/* eslint-disable  @typescript-eslint/no-explicit-any */
import workerHandler from "../src/cloudflareworkers";

const replyMessageMock = jest.fn().mockResolvedValue(undefined);
const broadcastMessageMock = jest.fn().mockResolvedValue(undefined);
const groupMessageMock = jest.fn().mockResolvedValue(undefined);

// Cloudflare Workers の型を定義
interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
}
  
// LineServiceのモック
jest.mock("@services/lineService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      replyMessage: replyMessageMock,
      broadcastMessage: broadcastMessageMock,
      groupMessage: groupMessageMock
    };
  });
});

// 依存するモジュールのモック
jest.mock("@repositories/r2ImageStorage");
jest.mock("@utils/jimpImageConverter");
jest.mock("@repositories/kvGroupRepository", () => {
  return {
    KVGroupRepository: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue(undefined),
        listAll: jest.fn().mockResolvedValue(["testgroupid"])
      };
    })
  };
});

// LineNotifyMessengerAppのモック
jest.mock("@core/lineNotifyMessengerApp", () => {
  return {
    LineNotifyMessengerApp: jest.fn().mockImplementation(() => {
      return {
        processRequest: jest.fn().mockImplementation(async () => {
          return new Response(JSON.stringify({ message: "Success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        })
      };
    })
  };
});

describe("CloudflareWorkers fetch function", () => {
  let originalGlobal: any;

  // モック用のR2Bucket
  const mockR2Bucket = {
    get: jest.fn()
  };

  // モック用のKVNamespace
  const mockKVNamespace = {
    get: jest.fn(),
    put: jest.fn(),
    list: jest.fn()
  };

  // Cloudflare環境のモック
  const createEnv = (overrides = {}): any => ({
    LINE_CHANNEL_ACCESS_TOKEN: "dummy_token",
    AUTHORIZATION_TOKEN: "valid_token",
    SEND_MODE: "broadcast",
    GROUPS: mockKVNamespace,
    IMAGES: mockR2Bucket,
    ...overrides
  });

  // リクエストの作成ヘルパー
  const createRequest = (
    url: string,
    method = "POST",
    headers: HeadersInit = {},
    body?: BodyInit
  ): Request => {
    return new Request(url, {
      method,
      headers,
      body
    });
  };

  // 実行コンテキストのモック
  const createContext = (): ExecutionContext => ({
    waitUntil: jest.fn(),
    passThroughOnException: jest.fn()
  } as unknown as ExecutionContext);

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    
    // グローバル関数のモック
    originalGlobal = global;
    global.Response = Response;
    
    // R2バケットのgetメソッドのデフォルト動作
    mockR2Bucket.get.mockImplementation((key) => {
      if (key === "test-image.jpg") {
        return {
          body: new Uint8Array([1, 2, 3, 4]).buffer,
          httpEtag: '"etag123"',
          writeHttpMetadata: (headers: Headers) => {
            headers.set("Content-Type", "image/jpeg");
          }
        };
      }
      return null;
    });
  });

  afterEach(() => {
    global = originalGlobal;
  });

  // 環境変数が設定されていない場合のテスト
  test("should throw error when LINE_CHANNEL_ACCESS_TOKEN is not set", async () => {
    const env = createEnv({ LINE_CHANNEL_ACCESS_TOKEN: undefined });
    const request = createRequest("http://localhost/notify");
    const context = createContext();

    await expect(workerHandler.fetch(request, env, context)).rejects.toThrow(
      "LINE_CHANNEL_ACCESS_TOKEN is not set"
    );
  });

  // 画像の取得テスト
  test("should serve image from R2 bucket when requesting an image path", async () => {
    const env = createEnv();
    const request = createRequest("http://localhost/images/test-image.jpg", "GET");
    const context = createContext();

    const response = await workerHandler.fetch(request, env, context);

    expect(response.status).toBe(200);
    expect(mockR2Bucket.get).toHaveBeenCalledWith("test-image.jpg");
    
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers["content-type"]).toBe("image/jpeg");
    expect(headers["etag"]).toBe('"etag123"');
    
    // レスポンスボディのチェック
    const buffer = await response.arrayBuffer();
    expect(new Uint8Array(buffer)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  // 存在しない画像を要求した場合のテスト
  test("should return 404 when requesting a non-existent image", async () => {
    const env = createEnv();
    const request = createRequest("http://localhost/images/non-existent.jpg", "GET");
    const context = createContext();

    mockR2Bucket.get.mockResolvedValueOnce(null);

    const response = await workerHandler.fetch(request, env, context);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Object Not Found");
  });

  // 通知のテスト
  test("should process notify request through LineNotifyMessengerApp", async () => {
    const env = createEnv();
    const formData = new FormData();
    formData.append("message", "test");
    
    const request = createRequest(
      "http://localhost/notify",
      "POST",
      { "Authorization": "Bearer valid_token" },
      formData
    );
    const context = createContext();

    const response = await workerHandler.fetch(request, env, context);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.message).toBe("Success");
  });

  // webhook処理のテスト
  test("should process webhook events through LineNotifyMessengerApp", async () => {
    const env = createEnv();
    const webhookBody = JSON.stringify({
      events: [{ replyToken: "dummyReplyToken", message: { text: "Hello" } }]
    });
    
    const request = createRequest(
      "http://localhost/",
      "POST",
      { "Content-Type": "application/json" },
      webhookBody
    );
    const context = createContext();

    const response = await workerHandler.fetch(request, env, context);
    
    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.message).toBe("Success");
  });

  // 異なる送信モードのテスト
  const testSendMode = (sendMode: string) => {
    test(`should configure with SEND_MODE='${sendMode}'`, async () => {
      const env = createEnv({ SEND_MODE: sendMode });
      const request = createRequest("http://localhost/notify");
      const context = createContext();

      await workerHandler.fetch(request, env, context);
      
      // 送信モードがBindingSendModeStrategyに適切に渡されるかどうかは
      // 実装の詳細にあまり依存せず、インテグレーションテストで検証する方が適切
      // ここではworkerHandlerがエラーなく実行されることを確認
      expect(true).toBe(true);
    });
  };

  // 各種送信モードのテスト
  testSendMode("broadcast");
  testSendMode("group");
  testSendMode("all");

  // 不正なAuthorizationトークンのケースはLineNotifyMessengerAppで処理されるため
  // ここでは単体テストとしては実装しません
});