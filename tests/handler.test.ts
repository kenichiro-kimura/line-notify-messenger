import { handler } from "../src/handler";
import LineService from "../src/lineService"; // jest.mock によってモック化される

const replyMessageMock = jest.fn().mockResolvedValue(undefined);
const broadcastMessageMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../src/lineService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      replyMessage: replyMessageMock,
      broadcastMessage: broadcastMessageMock,
    };
  });
});

describe("handler function", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks(); // 各テストの前にモックの呼び出し回数をリセット
    process.env = { ...ORIGINAL_ENV, LINE_CHANNEL_ACCESS_TOKEN: "dummy_token", AUTHORIZATION_TOKEN: "valid_token" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  test("should return internal server error when LINE_CHANNEL_ACCESS_TOKEN is not set", async () => {
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const event = {
      body: "{}"
    };

    const response = await handler(event);
    // HTTP ステータス 500 を検証
    expect(response.statusCode).toEqual(500);
    const payload = JSON.parse(response.body);
    expect(payload.message).toContain("LINE_CHANNEL_ACCESS_TOKEN is not set");
  });

  test("should handle notify event branch and call broadcastMessage with parsed form data", async () => {
    const event = {
      headers: { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer valid_token" },
      rawPath: "/notify",
      requestContext: { http: { method: "POST" } },
      // "message=test" を base64 エンコードした文字列
      body: Buffer.from("message=test").toString("base64"),
      isBase64Encoded: true
    };

    await handler(event);
    // broadcastMessage が 1 回呼ばれていることを検証
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  test("should return unauthorized error when AUTHORIZATION_TOKEN is invalid", async () => {
    const event = {
      headers: { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer invalid_token" },
      rawPath: "/notify",
      requestContext: { http: { method: "POST" } },
      // "message=test" を base64 エンコードした文字列
      body: Buffer.from("message=test").toString("base64"),
      isBase64Encoded: true
    };

    const response = await handler(event);
    // HTTP ステータス 401 を検証
    expect(response.statusCode).toEqual(401);
    const payload = JSON.parse(response.body);
    expect(payload.message).toContain("Invalid authorization token");
  });

  test("should handle health check event branch when events array is empty", async () => {
    const event = {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: [] })
    };

    const response = await handler(event);
    expect(response.statusCode).toEqual(200);
    const payload = JSON.parse(response.body);
    expect(payload.message).toEqual("No events");
  });

  test("should handle reply default message branch for normal events", async () => {
    const event = {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: [{ replyToken: "dummyReplyToken", message: { text: "Hello" } }] })
    };

    const response = await handler(event);
    expect(response.statusCode).toEqual(200);
    const payload = JSON.parse(response.body);
    expect(payload.message).toEqual("Success");

    // モック化された LineService のインスタンスから replyMessage の呼び出しを検証
    expect(replyMessageMock).toHaveBeenCalledTimes(1);
    expect(replyMessageMock).toHaveBeenCalledWith(
      "dummyReplyToken",
      "お送り頂いたメッセージはどこにも送られないのでご注意ください"
    );
  });
});