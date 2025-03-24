import { IGroupRepository } from "@interfaces/groupRepository";

/**
 * Cloudflare KVを使用したIGroupRepositoryの実装
 */
export class KVGroupRepository implements IGroupRepository {
  private namespace: KVNamespace<string>;

  /**
   * コンストラクタ
   * @param namespace - Cloudflare KV Namespace
   */
  constructor(namespace: KVNamespace<string>) {
    this.namespace = namespace;
  }

  /**
   * 新しいグループIDをリポジトリに追加します
   * @param groupName - 追加するLINEグループID
   */
  async add(groupName: string): Promise<void> {
    try {
      const upsertGroups = {"name": groupName};
      console.log(`Adding group ${groupName}`);
      await this.namespace.put(groupName, JSON.stringify(upsertGroups));
    } catch (error) {
      console.error(`Error adding group ${groupName}:`, error);
      throw new Error(`Failed to add group: ${error}`);
    }
  }

  /**
   * 指定したグループIDをリポジトリから削除します
   * @param groupName - 削除するLINEグループID
   */
  async remove(groupName: string): Promise<void> {
    try {
      // グループリストを更新
      await this.namespace.delete(groupName);
    } catch (error) {
      console.error(`Error removing group ${groupName}:`, error);
      throw new Error(`Failed to remove group: ${error}`);
    }
  }

  /**
   * 登録されているすべてのグループIDを取得します
   * @returns グループIDの配列
   */
  async listAll(): Promise<string[]> {
    try {
      // KVからグループリストを取得
      const groupsJson = await this.namespace.list();
      
      // グループリストが存在しない場合は空の配列を返す
      if (!groupsJson) {
        return [];
      }
      
      // グループリストを返す
      return groupsJson.keys.map((group) => group.name);
    } catch (error) {
      console.error("Error listing groups:", error);
      return [];
    }
  }
}
