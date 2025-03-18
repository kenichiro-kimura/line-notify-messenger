/**
 * LINEグループ情報を管理するリポジトリのインターフェース
 * グループIDの追加、削除、一覧取得などの基本的なCRUD操作を定義します
 */
export interface IGroupRepository {
    /**
     * 新しいグループIDをリポジトリに追加します
     * @param groupName - 追加するLINEグループID
     * @returns 処理完了を表すPromise
     */
    add(groupName: string): Promise<void>;
    
    /**
     * 指定したグループIDをリポジトリから削除します
     * @param groupName - 削除するLINEグループID
     * @returns 処理完了を表すPromise
     */
    remove(groupName: string): Promise<void>;
    
    /**
     * 登録されているすべてのグループIDを取得します
     * @returns グループIDの配列を含むPromise
     */
    listAll(): Promise<string[]>;
}
