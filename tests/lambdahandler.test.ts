import { handler } from "../src/lambdahandler";

const replyMessageMock = jest.fn().mockResolvedValue(undefined);
const broadcastMessageMock = jest.fn().mockResolvedValue(undefined);
const groupMessageMock = jest.fn().mockResolvedValue(undefined);
const multipartMessage = "----tstbdr---\r\nContent-Disposition: form-data; name=\"message\"\r\n\r\ntest\r\n\r\n----tstbdr---\r\nContent-Disposition: form-data; name=\"imageFile\"; filename=\"a.jpg\"\r\nContent-Type: image/jpeg\r\n\r\naaaa\r\n\r\n----tstbdr---\r\n";

jest.mock("../src/lineService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      replyMessage: replyMessageMock,
      broadcastMessage: broadcastMessageMock,
      groupMessage: groupMessageMock
    };
  });
});

jest.mock("../src/dynamoGroupRepository", () => {
  return {
    DynamoGroupRepository: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue(undefined),
        listAll: jest.fn().mockResolvedValue(["testgroupid"])
      };
    })
  };
});

jest.mock("../src/s3ImageStorage");
jest.mock("../src/jimpImageConverter");

describe("handler function", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks(); // 各テストの前にモックの呼び出し回数をリセット
    process.env = { 
      ...ORIGINAL_ENV, 
      LINE_CHANNEL_ACCESS_TOKEN: "dummy_token", 
      AUTHORIZATION_TOKEN: "valid_token",
      BUCKET_NAME: "bucket_name",
      S3_REGION: "s3_region",
      TABLE_NAME: "table_name",
      DYNAMO_REGION: "dynamo_region",
      SEND_MODE: "broadcast"
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  test("should throw error when LINE_CHANNEL_ACCESS_TOKEN is not set", async () => {
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const event = {
      body: "{}"
    };

    // 例外が投げられることを検証
    await expect(handler(event)).rejects.toThrow("LINE_CHANNEL_ACCESS_TOKEN is not set");
  });


  test("should throw error when BUCKET_NAME is not set", async () => {
    delete process.env.BUCKET_NAME;
    const event = {
      body: "{}"
    };

    await expect(handler(event)).rejects.toThrow("BUCKET_NAME or S3_REGION is not set");
  });

  test("should throw error when S3_REGION is not set", async () => {
    delete process.env.S3_REGION;
    const event = {
      body: "{}"
    };

    await expect(handler(event)).rejects.toThrow("BUCKET_NAME or S3_REGION is not set");
  });

  test("should throw error when TABLE_NAME is not set", async () => {
    delete process.env.TABLE_NAME;
    const event = {
      body: "{}"
    };

    await expect(handler(event)).rejects.toThrow("TABLE_NAME or DYNAMO_REGION is not set");
  });

  test("should throw error when DYNAMO_REGION is not set", async () => {
    delete process.env.DYNAMO_REGION;
    const event = {
      body: "{}"
    };

    await expect(handler(event)).rejects.toThrow("TABLE_NAME or DYNAMO_REGION is not set");
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

  test("should handle notify event branch and call groupMessage with parsed form data and SEND_MODE is 'group'", async () => {
    process.env.SEND_MODE = "group";
    const event = {
      headers: { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer valid_token" },
      rawPath: "/notify",
      requestContext: { http: { method: "POST" } },
      // "message=test" を base64 エンコードした文字列
      body: Buffer.from("message=test").toString("base64"),
      isBase64Encoded: true
    };

    await handler(event);
    // groupMessage が 1 回呼ばれていることを検証
    expect(groupMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(groupMessageMock).toHaveBeenCalledWith([ "testgroupid" ],{ message: "test" });
  });

  test("should handle notify event branch and call groupMessage and broadcastMessage with parsed form data and SEND_MODE is 'all'", async () => {
    process.env.SEND_MODE = "all";
    const event = {
      headers: { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer valid_token" },
      rawPath: "/notify",
      requestContext: { http: { method: "POST" } },
      // "message=test" を base64 エンコードした文字列
      body: Buffer.from("message=test").toString("base64"),
      isBase64Encoded: true
    };

    await handler(event);
    // groupMessageとbroadcastMessage が 1 回呼ばれていることを検証
    expect(groupMessageMock).toHaveBeenCalledTimes(1);
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(groupMessageMock).toHaveBeenCalledWith([ "testgroupid" ],{ message: "test" });
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  test("should handle notify event branch and call broadcastMessage with parsed form data, with multipart form data", async () => {
    const event = {
      headers: { "content-type": "multipart/form-data;  boundary=----tstbdr---", "authorization": "Bearer valid_token" },
      rawPath: "/notify",
      requestContext: { http: { method: "POST" } },
      // multipartMessage を base64 エンコードした文字列
      body: Buffer.from(multipartMessage).toString("base64"),
      isBase64Encoded: true
    };

    await handler(event);
    // broadcastMessage が 1 回呼ばれていることを検証
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test", imageFile: { type: "file",filename: "a.jpg", contentType: "image/jpeg", content: Buffer.from("aaaa") } });
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