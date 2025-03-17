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

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks(); // 各テストの前にモックの呼び出し回数をリセット
    process.env = {
      ...ORIGINAL_ENV,
      LINE_CHANNEL_ACCESS_TOKEN: "dummy_token",
      AUTHORIZATION_TOKEN: "valid_token",
      BLOB_NAME: "blob_name",
      BLOB_CONNECTION_STRING: "blob_connection_string",
      TABLE_NAME: "table_name",
      TABLE_CONNECTION_STRING: "table_connection_string",
      SEND_MODE: "broadcast"
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  test("should throw error when LINE_CHANNEL_ACCESS_TOKEN is not set", async () => {
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const request = {} as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    // 例外が投げられることを検証
    await expect(HttpTrigger(request,context)).rejects.toThrow("LINE_CHANNEL_ACCESS_TOKEN is not set");
  });

  test("should throw error when BLOB_NAME is not set", async () => {
    delete process.env.BLOB_NAME;
    const request = {} as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    // 例外が投げられることを検証
    await expect(HttpTrigger(request,context)).rejects.toThrow("BLOB_NAME or BLOB_CONNECTION_STRING is not set");
  });

  test("should throw error when BLOB_CONNECTION_STRING is not set", async () => {
    delete process.env.BLOB_CONNECTION_STRING;
    const request = {} as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    // 例外が投げられることを検証
    await expect(HttpTrigger(request,context)).rejects.toThrow("BLOB_NAME or BLOB_CONNECTION_STRING is not set");
  });

  test("should throw error when TABLE_NAME is not set", async () => {
    delete process.env.TABLE_NAME;
    const request = {} as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    // 例外が投げられることを検証
    await expect(HttpTrigger(request,context)).rejects.toThrow("TABLE_NAME or TABLE_CONNECTION_STRING is not set");
  });

  test("should throw error when TABLE_CONNECTION_STRING is not set", async () => {
    delete process.env.TABLE_CONNECTION_STRING;
    const request = {} as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    // 例外が投げられることを検証
    await expect(HttpTrigger(request,context)).rejects.toThrow("TABLE_NAME or TABLE_CONNECTION_STRING is not set");
  });

  test("should handle notify event branch and call broadcastMessage with parsed form data", async () => {
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/notify',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "application/x-www-form-urlencoded";
              case "Authorization":
                return "Bearer valid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, FormDataEntryValue> = new Map();
        hashmap.set("message", "test");
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(Buffer.from("message=test").toString("base64")),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);
    // HTTP ステータス 200 を検証
    expect(response.status).toEqual(200);
    expect(response.body).toContain("Success Notify");
    // broadcastMessage が 1 回呼ばれていることを検証
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  test("should handle notify event branch and call groupMessage with parsed form data and SEND_MODE is 'group'", async () => {
    process.env.SEND_MODE = "group";
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/notify',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "application/x-www-form-urlencoded";
              case "Authorization":
                return "Bearer valid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, FormDataEntryValue> = new Map();
        hashmap.set("message", "test");
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(Buffer.from("message=test").toString("base64")),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);
    // HTTP ステータス 200 を検証
    expect(response.status).toEqual(200);
    expect(response.body).toContain("Success Notify");
    // groupMessage が 1 回呼ばれていることを検証
    expect(groupMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(groupMessageMock).toHaveBeenCalledWith([ "testgroupid" ], { message: "test" });
  });

  test("should handle notify event branch and call groupMessage and broadcastMessage with parsed form data and SEND_MODE is 'all'", async () => {
    process.env.SEND_MODE = "all";
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/notify',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "application/x-www-form-urlencoded";
              case "Authorization":
                return "Bearer valid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, FormDataEntryValue> = new Map();
        hashmap.set("message", "test");
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(Buffer.from("message=test").toString("base64")),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);
    // HTTP ステータス 200 を検証
    expect(response.status).toEqual(200);
    expect(response.body).toContain("Success Notify");
    // groupMessageとbroadcastMessage が 1 回呼ばれていることを検証
    expect(groupMessageMock).toHaveBeenCalledTimes(1);
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(groupMessageMock).toHaveBeenCalledWith([ "testgroupid" ], { message: "test" });
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test" });
  });

  test("should handle notify event branch and call broadcastMessage with parsed form data, with multipart form data", async () => {
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/notify',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "multipart/form-data;  boundary=----tstbdr---";
              case "Authorization":
                return "Bearer valid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, any> = new Map();
        hashmap.set("message", "test");
        hashmap.set("imageFile", { name: "a.jpg", type: "image/jpeg", arrayBuffer: jest.fn().mockResolvedValue(Buffer.from("aaaa")) });
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(Buffer.from("message=test").toString("base64")),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);

    // HTTP ステータス 200 を検証
    expect(response.status).toEqual(200);
    expect(response.body).toContain("Success Notify");
    // broadcastMessage が 1 回呼ばれていることを検証
    expect(broadcastMessageMock).toHaveBeenCalledTimes(1);
    // 送信された引数（querystring.parse により { message: "test" } となることを想定）
    expect(broadcastMessageMock).toHaveBeenCalledWith({ message: "test", imageFile: { type: "file",filename: "a.jpg", contentType: "image/jpeg", content: Buffer.from("aaaa") } });
  });

  test("should return unauthorized error when AUTHORIZATION_TOKEN is invalid", async () => {
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/notify',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "application/x-www-form-urlencoded";
              case "Authorization":
                return "Bearer invalid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, FormDataEntryValue> = new Map();
        hashmap.set("message", "test");
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(Buffer.from("message=test").toString("base64")),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);
    // HTTP ステータス 401 を検証
    expect(response.status).toEqual(401);
    expect(response.body).toContain("Invalid authorization token");
  });

  test("should handle health check event branch when events array is empty", async () => {
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "application/x-www-form-urlencoded";
              case "Authorization":
                return "Bearer valid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, FormDataEntryValue> = new Map();
        hashmap.set("message", "test");
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(JSON.stringify({ events: [] })),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual("No events");
  });

  test("should handle reply default message branch for normal events", async () => {
    const request = {
      url: 'http://localhost:7071/api/HttpTrigger/',
      method: 'POST',
      headers: {
        get: jest.fn().mockImplementation((x) => {
            switch (x) {
              case "content-type":
                return "application/x-www-form-urlencoded";
              case "Authorization":
                return "Bearer valid_token";
              default:
                return ""
            }
        }),
      },
      formData: jest.fn().mockImplementation(() => {
        const hashmap: Map<string, FormDataEntryValue> = new Map();
        hashmap.set("message", "test");
        return hashmap;
      }),
      text: jest.fn().mockResolvedValue(JSON.stringify({ events: [{ replyToken: "dummyReplyToken", message: { text: "Hello" } }] })),
    } as unknown as HttpRequest;
    const context = { 
      log: jest.fn(),
    } as unknown as InvocationContext;

    const response = await HttpTrigger(request, context);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual("Success");

    // モック化された LineService のインスタンスから replyMessage の呼び出しを検証
    expect(replyMessageMock).toHaveBeenCalledTimes(1);
    expect(replyMessageMock).toHaveBeenCalledWith(
      "dummyReplyToken",
      "お送り頂いたメッセージはどこにも送られないのでご注意ください"
    );
  });
});