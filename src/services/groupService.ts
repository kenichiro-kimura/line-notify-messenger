/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { IGroupRepository } from '@interfaces/groupRepository';
import { inject, injectable } from 'tsyringe';

@injectable()
export class GroupService {
    private groupRepository: IGroupRepository;

    constructor(
        @inject('IGroupRepository') groupRepository: IGroupRepository,
    ) {
        this.groupRepository = groupRepository;
    }

    getRequestGroupId(body: any): string {
        return body.events[0]?.source?.groupId || '';
    }

    async addGroupId(groupId: string): Promise<void> {
        await this.groupRepository.add(groupId);
    }

    async getTargetGroupIds(): Promise<string[]> {
        return this.groupRepository.listAll();
    }
}
