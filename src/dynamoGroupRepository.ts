/* eslint-disable  @typescript-eslint/no-explicit-any */
import { IGroupRepository } from './groupRepository';
import { DynamoDB } from 'aws-sdk';
    
export class DynamoGroupRepository implements IGroupRepository {
    private readonly tableName: string;
    private readonly docClient: DynamoDB.DocumentClient;
    
    constructor(tableName: string) {
        this.tableName = tableName;
        this.docClient = new DynamoDB.DocumentClient();
    }
    
    public async add(groupName: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Item: {
                'groupName': groupName
            },
            ConditionExpression: 'attribute_not_exists(groupName)'
        };
    
        try {
            await this.docClient.put(params).promise();
            return;
        } catch (error) {
            if ((error as any).code === 'ConditionalCheckFailedException') {
                return;
            }
            throw error;
        }
    }
    
    public async remove(groupName: string): Promise<void> {
        const params = {
            TableName: this.tableName,
            Key: {
                'groupName': groupName
            }
        };
    
        await this.docClient.delete(params).promise();
    }
    
    public async listAll(): Promise<string[]> {
        const params = {
            TableName: this.tableName
        };
    
        const result = await this.docClient.scan(params).promise();
        return result.Items?.map((item: any) => item.groupName) || [];
    }
}