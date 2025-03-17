/* eslint-disable  @typescript-eslint/no-explicit-any */
import { handler } from "../src/lambdahandler";

const replyMessageMock = jest.fn().mockResolvedValue(undefined);
const broadcastMessageMock = jest.fn().mockResolvedValue(undefined);
const groupMessageMock = jest.fn().mockResolvedValue(undefined);
const multipartMessage = "----tstbdr---\r\nContent-Disposition: form-data; name=\"message\"\r\n\r\ntest\r\n\r\n----tstbdr---\r\nContent-Disposition: form-data; name=\"imageFile\"; filename=\"a.jpg\"\r\nContent-Type: image/jpeg\r\n\r\naaaa\r\n\r\n----tstbdr---\r\n";

jest.mock("@services/lineService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      replyMessage: replyMessageMock,
      broadcastMessage: broadcastMessageMock,
      groupMessage: groupMessageMock
    };
  });
});

jest.mock("@repositories/dynamoGroupRepository", () => {
  return {
    DynamoGroupRepository: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue(undefined),
        listAll: jest.fn().mockResolvedValue(["testgroupid"])
      };
    })
  };
});

jest.mock("@repositories/s3ImageStorage");
jest.mock("@utils/jimpImageConverter");

describe("handler function", () => {
  const ORIGINAL_ENV = process.env;

  const createEvent = (headers: Record<string, string>, path: string, body: any, isBase64Encoded = false): any => ({
    headers,
    rawPath: path,
    requestContext: { http: { method: "POST" } },
    body: isBase64Encoded ? Buffer.from(body).toString("base64") : body,
    isBase64Encoded
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
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

  const testMissingEnvVar = (envVar: string, expectedError: string) => {
    test(`should throw error when ${envVar} is not set`, async () => {
      delete process.env[envVar];
      const event = createEvent({}, "/", "{}");

      await expect(handler(event)).rejects.toThrow(expectedError);
    });
  };

  testMissingEnvVar("LINE_CHANNEL_ACCESS_TOKEN", "LINE_CHANNEL_ACCESS_TOKEN is not set");
  testMissingEnvVar("BUCKET_NAME", "BUCKET_NAME or S3_REGION is not set");
  testMissingEnvVar("S3_REGION", "BUCKET_NAME or S3_REGION is not set");
  testMissingEnvVar("TABLE_NAME", "TABLE_NAME or DYNAMO_REGION is not set");
  testMissingEnvVar("DYNAMO_REGION", "TABLE_NAME or DYNAMO_REGION is not set");

  test("should handle notify event and call broadcastMessage with parsed form data", async () => {
    const event = createEvent(
      { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer valid_token" },
      "/notify",
      "message=test",
      true
    );

    await handler(event);

    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  test("should handle notify event and call groupMessage with SEND_MODE 'group'", async () => {
    process.env.SEND_MODE = "group";
    const event = createEvent(
      { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer valid_token" },
      "/notify",
      "message=test",
      true
    );

    await handler(event);

    expect(groupMessageMock).toHaveBeenCalledTimes(1);
    expect(groupMessageMock).toHaveBeenCalledWith(["testgroupid"], { message: "test" });
  });

  test("should handle notify event and call groupMessage and broadcastMessage with SEND_MODE 'all'", async () => {
    process.env.SEND_MODE = "all";
    const event = createEvent(
      { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer valid_token" },
      "/notify",
      "message=test",
      true
    );

    await handler(event);

    expect(groupMessageMock).toHaveBeenCalledTimes(1);
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    expect(groupMessageMock).toHaveBeenCalledWith(["testgroupid"], { message: "test" });
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  test("should handle notify event with multipart form data", async () => {
    const event = createEvent(
      { "content-type": "multipart/form-data; boundary=----tstbdr---", "authorization": "Bearer valid_token" },
      "/notify",
      multipartMessage,
      true
    );

    await handler(event);

    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    expect(broadcastMessageMock).toHaveBeenCalledWith({
      message: "test",
      imageFile: {
        type: "file",
        filename: "a.jpg",
        contentType: "image/jpeg",
        content: Buffer.from("aaaa")
      }
    });
  });

  test("should return unauthorized error when AUTHORIZATION_TOKEN is invalid", async () => {
    const event = createEvent(
      { "content-type": "application/x-www-form-urlencoded", "authorization": "Bearer invalid_token" },
      "/notify",
      "message=test",
      true
    );

    const response = await handler(event);

    expect(response.statusCode).toEqual(401);
    const payload = JSON.parse(response.body);
    expect(payload.message).toContain("Invalid authorization token");
  });

  test("should handle health check event when events array is empty", async () => {
    const event = createEvent(
      { "content-type": "application/json" },
      "/",
      JSON.stringify({ events: [] })
    );

    const response = await handler(event);

    expect(response.statusCode).toEqual(200);
    const payload = JSON.parse(response.body);
    expect(payload.message).toEqual("No events");
  });

  test("should handle reply default message for normal events", async () => {
    const event = createEvent(
      { "content-type": "application/json" },
      "/",
      JSON.stringify({ events: [{ replyToken: "dummyReplyToken", message: { text: "Hello" } }] })
    );

    const response = await handler(event);

    expect(response.statusCode).toEqual(200);
    const payload = JSON.parse(response.body);
    expect(payload.message).toEqual("Success");

    expect(replyMessageMock).toHaveBeenCalledTimes(1);
    expect(replyMessageMock).toHaveBeenCalledWith(
      "dummyReplyToken",
      "お送り頂いたメッセージはどこにも送られないのでご注意ください"
    );
  });
});