export interface IGroupRepository {
    add(groupName: string): Promise<void> ;
    remove(groupName: string): Promise<void> ;
    listAll(): Promise<string[]> ;
}
