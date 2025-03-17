/* eslint-disable  @typescript-eslint/no-explicit-any */
import { TableStorageGroupRepository } from "../src/tableStorageGroupRepository";
import { TableClient } from "@azure/data-tables";

jest.mock("@azure/data-tables", () => ({
  TableClient: {
    fromConnectionString: jest.fn(() => ({
      upsertEntity: jest.fn(),
      deleteEntity: jest.fn(),
      listEntities: jest.fn(),
    })),
  },
  TableServiceClient: {
    fromConnectionString: jest.fn(() => ({
      createTable: jest.fn().mockResolvedValue(undefined),
    })),
  },
  odata: jest.fn((strings: TemplateStringsArray, ...values: any[]) => {
    return strings.reduce((result, str, i) => result + str + (values[i] || ""), "");
  }),
}));

describe("TableStorageGroupRepository", () => {
  const connectionString = "UseDevelopmentStorage=true";
  const tableName = "testTable";
  let repository: TableStorageGroupRepository;
  let mockTableClient: any;

  beforeEach(() => {
    repository = new TableStorageGroupRepository(connectionString, tableName);
    mockTableClient = (TableClient.fromConnectionString as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should add a group", async () => {
    const groupName = "testGroup";

    await repository.add(groupName);

    expect(mockTableClient.upsertEntity).toHaveBeenCalledWith(
      {
        partitionKey: "groups",
        rowKey: groupName,
        groupName: groupName,
      },
      "Merge"
    );
  });

  it("should remove a group", async () => {
    const groupName = "testGroup";

    await repository.remove(groupName);

    expect(mockTableClient.deleteEntity).toHaveBeenCalledWith("groups", groupName);
  });

  it("should ignore 404 error when removing a non-existent group", async () => {
    const groupName = "nonExistentGroup";
    mockTableClient.deleteEntity.mockRejectedValue({ statusCode: 404 });

    await expect(repository.remove(groupName)).resolves.not.toThrow();

    expect(mockTableClient.deleteEntity).toHaveBeenCalledWith("groups", groupName);
  });

  it("should list all groups", async () => {
    const mockEntities = [
      { groupName: "group1" },
      { groupName: "group2" },
    ];
    mockTableClient.listEntities.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        for (const entity of mockEntities) {
          yield entity;
        }
      },
    });

    const result = await repository.listAll();

    expect(result).toEqual(["group1", "group2"]);
    expect(mockTableClient.listEntities).toHaveBeenCalledWith({
      queryOptions: { filter: `PartitionKey eq groups` },
    });
  });
});
