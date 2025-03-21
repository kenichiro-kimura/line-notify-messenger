import { IGroupRepository } from "@interfaces/groupRepository";

/**
 * Cloudflare KVを使用したIGroupRepositoryの実装
 */
export class KVGroupRepository implements IGroupRepository {
  private namespace: KVNamespace;
  private readonly KEY_PREFIX = "lineGroup:";
  private readonly GROUP_LIST_KEY = "lineGroups";

  /**
   * コンストラクタ
   * @param namespace - Cloudflare KV Namespace
   */
  constructor(namespace: KVNamespace) {
    this.namespace = namespace;
  }

  /**
   * 新しいグループIDをリポジトリに追加します
   * @param groupName - 追加するLINEグループID
   */
  async add(groupName: string): Promise<void> {
    try {
      // 現在のグループリストを取得
      const groups = await this.listAll();
      
      // グループがまだ存在しない場合のみ追加
      if (!groups.includes(groupName)) {
        // グループリストを更新
        const updatedGroups = [...groups, groupName];
        await this.namespace.put(this.GROUP_LIST_KEY, JSON.stringify(updatedGroups));
      }
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
      // 現在のグループリストを取得
      const groups = await this.listAll();
      
      // 指定されたグループを除外した新しいリストを作成
      const updatedGroups = groups.filter(group => group !== groupName);
      
      // グループリストを更新
      await this.namespace.put(this.GROUP_LIST_KEY, JSON.stringify(updatedGroups));
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
      const groupsJson = await this.namespace.get(this.GROUP_LIST_KEY);
      
      // グループリストが存在しない場合は空の配列を返す
      if (!groupsJson) {
        return [];
      }
      
      return JSON.parse(groupsJson) as string[];
    } catch (error) {
      console.error("Error listing groups:", error);
      return [];
    }
  }
}
