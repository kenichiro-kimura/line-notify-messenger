/* eslint-disable  @typescript-eslint/no-explicit-any */
import { IGroupRepository } from "./interfaces/groupRepository";
import { TableClient, TableServiceClient, TableEntity, odata } from "@azure/data-tables";

interface GroupEntity extends TableEntity {
  groupName: string;
}

export class TableStorageGroupRepository implements IGroupRepository {
  private readonly tableName: string;
  private readonly tableClient: TableClient;
  private readonly partitionKey = "groups"; // すべてのグループに共通のパーティションキー

  constructor(connectionString: string, tableName: string) {
    this.tableName = tableName;

    // テーブルが存在しない場合は作成
    const tableServiceClient = TableServiceClient.fromConnectionString(connectionString, {
        allowInsecureConnection: true // ローカルテストのためにHTTP接続を許可
    });
    tableServiceClient.createTable(this.tableName).catch(() => {
        // テーブルが既に存在する場合はエラーを無視
    });

    // テーブルクライアントを作成
    this.tableClient = TableClient.fromConnectionString(connectionString, this.tableName, {
        allowInsecureConnection: true // ローカルテストのためにHTTP接続を許可
    });
  }

  public async add(groupName: string): Promise<void> {
    try {
      const entity: GroupEntity = {
        partitionKey: this.partitionKey,
        rowKey: groupName,
        groupName: groupName
      };

      // upsert操作：エンティティが存在しなければ作成、存在すれば何もしない
      await this.tableClient.upsertEntity(entity, "Merge");
    } catch (error) {
      console.error(`Error adding group ${groupName}:`, error);
      throw error;
    }
  }

  public async remove(groupName: string): Promise<void> {
    try {
      await this.tableClient.deleteEntity(this.partitionKey, groupName);
    } catch (error) {
      // エンティティが見つからない場合は無視
      if ((error as any).statusCode === 404) {
        return;
      }
      console.error(`Error removing group ${groupName}:`, error);
      throw error;
    }
  }

  public async listAll(): Promise<string[]> {
    const entities: GroupEntity[] = [];
    
    // クエリを実行してすべてのグループエンティティを取得
    const queryResults = this.tableClient.listEntities<GroupEntity>({
      queryOptions: { filter: odata`PartitionKey eq ${this.partitionKey}` }
    });

    for await (const entity of queryResults) {
      entities.push(entity);
    }

    // groupNameの配列を返す
    return entities.map(entity => entity.groupName);
  }
}

