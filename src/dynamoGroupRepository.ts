/* eslint-disable  @typescript-eslint/no-explicit-any */
import { IGroupRepository } from './interfaces/groupRepository';
import { DynamoDBClient, } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, PutCommandInput, ScanCommand, ScanCommandInput, DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

export class DynamoGroupRepository implements IGroupRepository {
    private readonly tableName: string;
    private readonly region: string;    
    private readonly docClient: DynamoDBDocumentClient;
    
    constructor(tableName: string, region: string) {
        this.tableName = tableName;
        this.region = region;
        this.docClient =  DynamoDBDocumentClient.from(new DynamoDBClient({ region: region }));
    }
    
    public async add(groupName: string): Promise<void> {
        const params: PutCommandInput  = {
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
    
    public async listAll(): Promise<string[]> {
        const params: ScanCommandInput = {
            TableName: this.tableName
        };
    
        const command = new ScanCommand(params);
        const result = await this.docClient.send(command);
        return result.Items?.map((item: any) => item.id) || [];
    }
}