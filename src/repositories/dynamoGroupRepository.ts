/* eslint-disable  @typescript-eslint/no-explicit-any */
import { IGroupRepository } from '@interfaces/groupRepository';
import { DynamoDBClient, } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, PutCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

/**
 * Amazon DynamoDBを使用したLINEグループ情報リポジトリの実装クラス
 * IGroupRepositoryインターフェースを実装し、DynamoDBにLINEグループIDを保存・取得する機能を提供します
 */
export class DynamoGroupRepository implements IGroupRepository {
    /** DynamoDBテーブル名 */
    private readonly tableName: string;
    /** AWS リージョン */
    private readonly region: string;    
    /** DynamoDB ドキュメントクライアント */
    private readonly docClient: DynamoDBDocumentClient;
    
    /**
     * DynamoGroupRepositoryのコンストラクタ
     * @param tableName グループ情報を保存するDynamoDBテーブル名
     * @param region AWS リージョン（例: 'ap-northeast-1'）
     */
    constructor(tableName: string, region: string) {
        this.tableName = tableName;
        this.region = region;
        this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: region }));
    }
    
    /**
     * 新しいグループIDをDynamoDBテーブルに追加します
     * 既に同じIDが存在する場合は上書きします
     * エラーが発生した場合は例外をキャッチして処理を続行します
     * 
     * @param groupName 追加するLINEグループID
     * @returns 処理完了を表すPromise
     */
    public async add(groupName: string): Promise<void> {
        const params: PutCommandInput = {
            TableName: this.tableName,
            Item: {
                id: groupName
            }
        };
        const command = new PutCommand(params);

        try {
            await this.docClient.send(command);
            return;
        } catch {
            return;
        }
    }
    
    /**
     * 指定したグループIDをDynamoDBテーブルから削除します
     * 
     * @param groupName 削除するLINEグループID
     * @returns 処理完了を表すPromise
     */
    public async remove(groupName: string): Promise<void> {
        const params: DeleteCommandInput = {
            TableName: this.tableName,
            Key: {
                id: groupName
            }
        };
        const command = new DeleteCommand(params);
        await this.docClient.send(command);
    }
    
    /**
     * DynamoDBテーブルに保存されているすべてのグループIDを取得します
     * 
     * @returns グループIDの配列を含むPromise
     */
    public async listAll(): Promise<string[]> {
        const params: ScanCommandInput = {
            TableName: this.tableName
        };
    
        const command = new ScanCommand(params);
        const result = await this.docClient.send(command);
        return result.Items?.map((item: any) => item.id) || [];
    }
}