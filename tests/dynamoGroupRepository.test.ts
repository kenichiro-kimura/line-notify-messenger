import { DynamoGroupRepository } from '../src/dynamoGroupRepository';
import { PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const sendMock = jest.fn();
jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn(() => ({
            send: sendMock,
        })),
    },
    PutCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    ScanCommand: jest.fn(),
}));

describe('DynamoGroupRepository', () => {
    const tableName = 'testTable';
    const region = 'us-east-1';
    let repository: DynamoGroupRepository;

    beforeEach(() => {
        repository = new DynamoGroupRepository(tableName, region);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should add a group', async () => {
        const groupName = 'testGroup';
        await repository.add(groupName);

        expect(PutCommand).toHaveBeenCalledWith({
            TableName: tableName,
            Item: { id: groupName },
        });
        expect(sendMock).toHaveBeenCalled();
    });

    it('should remove a group', async () => {
        const groupName = 'testGroup';
        await repository.remove(groupName);

        expect(DeleteCommand).toHaveBeenCalledWith({
            TableName: tableName,
            Key: { id: groupName },
        });
        expect(sendMock).toHaveBeenCalled();
    });

    it('should list all groups', async () => {
        const mockItems = [{ id: 'group1' }, { id: 'group2' }];
        sendMock.mockResolvedValueOnce({ Items: mockItems });

        const result = await repository.listAll();

        expect(ScanCommand).toHaveBeenCalledWith({ TableName: tableName });
        expect(sendMock).toHaveBeenCalled();
        expect(result).toEqual(['group1', 'group2']);
    });

    it('should return an empty array if no groups are found', async () => {
        sendMock.mockResolvedValueOnce({ Items: [] });

        const result = await repository.listAll();

        expect(ScanCommand).toHaveBeenCalledWith({ TableName: tableName });
        expect(sendMock).toHaveBeenCalled();
        expect(result).toEqual([]);
    });
});
