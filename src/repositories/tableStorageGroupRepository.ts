/* eslint-disable  @typescript-eslint/no-explicit-any */
import { IGroupRepository } from "@interfaces/groupRepository";
import { TableClient, TableServiceClient, TableEntity, odata } from "@azure/data-tables";

/**
 * LINEグループエンティティの型定義
 * Azure Table Storageに保存するグループ情報のスキーマを定義します
 */
interface GroupEntity extends TableEntity {
  groupName: string;
}

/**
 * Azure Table Storageを使用したLINEグループ情報リポジトリの実装クラス
 * IGroupRepositoryインターフェースを実装し、Table StorageにLINEグループIDを保存・取得する機能を提供します
 */
export class TableStorageGroupRepository implements IGroupRepository {
  /** Table Storage のテーブル名 */
  private readonly tableName: string;
  /** Table Storage クライアント */
  private readonly tableClient: TableClient;
  /** すべてのグループエンティティに共通のパーティションキー */
  private readonly partitionKey = "groups";

  /**
   * TableStorageGroupRepositoryのコンストラクタ
   * @param connectionString Azure Table Storageの接続文字列
   * @param tableName グループ情報を保存するテーブル名
   */
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

  /**
   * 新しいグループIDをTable Storageに追加します
   * 既に同じIDが存在する場合はマージ操作を行います
   * 
   * @param groupName 追加するLINEグループID
   * @returns 処理完了を表すPromise
   * @throws エラーが発生した場合は例外をスローします
   */
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

  /**
   * 指定したグループIDをTable Storageから削除します
   * 存在しない場合は無視します
   * 
   * @param groupName 削除するLINEグループID
   * @returns 処理完了を表すPromise
   * @throws 404エラー以外のエラーが発生した場合は例外をスローします
   */
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

  /**
   * Table Storageに保存されているすべてのグループIDを取得します
   * 
   * @returns グループIDの配列を含むPromise
   */
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
