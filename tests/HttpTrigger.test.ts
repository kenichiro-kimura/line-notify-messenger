/* eslint-disable  @typescript-eslint/no-explicit-any */
import { HttpRequest, InvocationContext } from "@azure/functions";
import { HttpTrigger } from "../src/functions/HttpTrigger";

const replyMessageMock = jest.fn().mockResolvedValue(undefined);
const broadcastMessageMock = jest.fn().mockResolvedValue(undefined);
const groupMessageMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../src/lineService", () => {
  return jest.fn().mockImplementation(() => {
    return {
      replyMessage: replyMessageMock,
      broadcastMessage: broadcastMessageMock,
      groupMessage: groupMessageMock
    };
  });
});

jest.mock("@azure/functions");
jest.mock("../src/blobImageStorage");
jest.mock("../src/jimpImageConverter");
jest.mock("../src/tableStorageGroupRepository", () => {
  return {
    TableStorageGroupRepository: jest.fn().mockImplementation(() => {
      return {
        add: jest.fn().mockResolvedValue(undefined),
        listAll: jest.fn().mockResolvedValue(["testgroupid"])
      };
    })
  };
});

describe("HttpTrigger function", () => {
  const ORIGINAL_ENV = process.env;

  const createRequest = (headers: Record<string, string>, path: string, body: any): HttpRequest => ({
    url: 'http://localhost:7071/api/HttpTrigger' + path,
    method: 'POST',
    headers: {
      get: jest.fn().mockImplementation((key) => headers[key] || ""),
    },
    formData: jest.fn().mockResolvedValue(new Map(Object.entries(body))),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as HttpRequest);

  const createContext = (): InvocationContext => ({
    log: jest.fn(),
  } as unknown as InvocationContext);

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      LINE_CHANNEL_ACCESS_TOKEN: "dummy_token",
      AUTHORIZATION_TOKEN: "valid_token",
      BLOB_NAME: "blob_name",
      BLOB_CONNECTION_STRING: "blob_connection_string",
      TABLE_NAME: "table_name",
      TABLE_CONNECTION_STRING: "table_connection_string",
      SEND_MODE: "broadcast",
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  const testMissingEnvVar = (envVar: string, expectedError: string) => {
    test(`should throw error when ${envVar} is not set`, async () => {
      delete process.env[envVar];
      const request = createRequest({}, "/", {});
      const context = createContext();

      await expect(HttpTrigger(request, context)).rejects.toThrow(expectedError);
    });
  };

  testMissingEnvVar("LINE_CHANNEL_ACCESS_TOKEN", "LINE_CHANNEL_ACCESS_TOKEN is not set");
  testMissingEnvVar("BLOB_NAME", "BLOB_NAME or BLOB_CONNECTION_STRING is not set");
  testMissingEnvVar("BLOB_CONNECTION_STRING", "BLOB_NAME or BLOB_CONNECTION_STRING is not set");
  testMissingEnvVar("TABLE_NAME", "TABLE_NAME or TABLE_CONNECTION_STRING is not set");
  testMissingEnvVar("TABLE_CONNECTION_STRING", "TABLE_NAME or TABLE_CONNECTION_STRING is not set");

  test("handles notify event and calls broadcastMessage", async () => {
    const request = createRequest(
      { "content-type": "application/x-www-form-urlencoded", Authorization: "Bearer valid_token" },
      "/notify",
      { message: "test" }
    );
    const context = createContext();

    const response = await HttpTrigger(request, context);

    expect(response.status).toBe(200);
    expect(response.body).toContain("Success Notify");
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  const testSendMode = (sendMode: string, expectedMocks: Array<{ mock: jest.Mock, args: any[] }>) => {
    test(`should handle notify event and call correct functions when SEND_MODE is '${sendMode}'`, async () => {
      process.env.SEND_MODE = sendMode;
      const request = createRequest(
        { "content-type": "application/x-www-form-urlencoded", Authorization: "Bearer valid_token" },
        "/notify",
        { message: "test" }
      );
      const context = createContext();

      const response = await HttpTrigger(request, context);

      expect(response.status).toBe(200);
      expect(response.body).toContain("Success Notify");

      expectedMocks.forEach(({ mock, args }) => {
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(...args);
      });
    });
  };

  testSendMode("group", [
    { mock: groupMessageMock, args: [["testgroupid"], { message: "test" }] }
  ]);

  testSendMode("all", [
    { mock: groupMessageMock, args: [["testgroupid"], { message: "test" }] },
    { mock: broadcastMessageMock, args: [{ message: "test" }] }
  ]);

  test("should return unauthorized error when AUTHORIZATION_TOKEN is invalid", async () => {
    const request = createRequest(
      { "content-type": "application/x-www-form-urlencoded", Authorization: "Bearer invalid_token" },
      "/notify",
      { message: "test" }
    );
    const context = createContext();

    const response = await HttpTrigger(request, context);

    expect(response.status).toBe(401);
    expect(response.body).toContain("Invalid authorization token");
  });

  test("should handle health check event branch when events array is empty", async () => {
    const request = createRequest(
      { Authorization: "Bearer valid_token" },
      "/",
      { events: [] }
    );
    const context = createContext();

    const response = await HttpTrigger(request, context);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual("No events");
  });

  test("should handle reply default message branch for normal events", async () => {
    const request = createRequest(
      { Authorization: "Bearer valid_token" },
      "/",
      { events: [{ replyToken: "dummyReplyToken", message: { text: "Hello" } }] }
    );
    const context = createContext();

    const response = await HttpTrigger(request, context);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual("Success");
    expect(replyMessageMock).toHaveBeenCalledTimes(1);
    expect(replyMessageMock).toHaveBeenCalledWith(
      "dummyReplyToken",
      "お送り頂いたメッセージはどこにも送られないのでご注意ください"
    );
  });
});