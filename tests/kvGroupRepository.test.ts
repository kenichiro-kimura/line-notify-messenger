import { KVGroupRepository } from '@repositories/kvGroupRepository';

// KVNamespaceのモックを作成
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockList = jest.fn();

// KVNamespaceのモックオブジェクト
const mockKVNamespace = {
  put: mockPut,
  delete: mockDelete,
  list: mockList
} as unknown as KVNamespace<string>;

describe('KVGroupRepository', () => {
  let repository: KVGroupRepository;

  beforeEach(() => {
    repository = new KVGroupRepository(mockKVNamespace);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add a group', async () => {
    const groupName = 'testGroup';
    await repository.add(groupName);

    expect(mockPut).toHaveBeenCalledWith(
      groupName, 
      JSON.stringify({"name": groupName})
    );
  });

  it('should throw error when adding a group fails', async () => {
    const groupName = 'testGroup';
    const error = new Error('KV error');
    mockPut.mockRejectedValueOnce(error);

    await expect(repository.add(groupName)).rejects.toThrow('Failed to add group');
  });

  it('should remove a group', async () => {
    const groupName = 'testGroup';
    await repository.remove(groupName);

    expect(mockDelete).toHaveBeenCalledWith(groupName);
  });

  it('should throw error when removing a group fails', async () => {
    const groupName = 'testGroup';
    const error = new Error('KV error');
    mockDelete.mockRejectedValueOnce(error);

    await expect(repository.remove(groupName)).rejects.toThrow('Failed to remove group');
  });

  it('should list all groups', async () => {
    const mockGroups = {
      keys: [
        { name: 'group1' },
        { name: 'group2' }
      ]
    };
    mockList.mockResolvedValueOnce(mockGroups);

    const result = await repository.listAll();

    expect(mockList).toHaveBeenCalled();
    expect(result).toEqual(['group1', 'group2']);
  });

  it('should return an empty array if no groups are found', async () => {
    mockList.mockResolvedValueOnce(null);

    const result = await repository.listAll();

    expect(mockList).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should return an empty array when listing groups fails', async () => {
    const error = new Error('KV error');
    mockList.mockRejectedValueOnce(error);

    const result = await repository.listAll();

    expect(mockList).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});