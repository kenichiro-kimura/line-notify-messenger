/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { IGroupRepository } from '@interfaces/groupRepository';
import { inject, injectable } from 'tsyringe';

/**
 * LINEグループ情報を管理するサービスクラス
 * グループIDの抽出、保存、取得などの操作を提供します
 */
@injectable()
export class GroupService {
    /** グループ情報の保存と取得を担当するリポジトリ */
    private groupRepository: IGroupRepository;

    /**
     * GroupServiceのコンストラクタ
     * @param groupRepository グループ情報リポジトリ
     */
    constructor(
        @inject('IGroupRepository') groupRepository: IGroupRepository,
    ) {
        this.groupRepository = groupRepository;
    }

    /**
     * LINEウェブフックのリクエストボディからグループIDを抽出します
     * @param body LINEウェブフックのリクエストボディ
     * @returns 抽出されたグループID（存在しない場合は空文字列）
     */
    getRequestGroupId(body: any): string {
        return body.events[0]?.source?.groupId || '';
    }

    /**
     * 新しいグループIDをリポジトリに追加します
     * @param groupId 追加するLINEグループID
     * @returns 処理完了を表すPromise
     */
    async addGroupId(groupId: string): Promise<void> {
        await this.groupRepository.add(groupId);
    }

    /**
     * 登録されているすべてのグループIDを取得します
     * @returns グループIDの配列を含むPromise
     */
    async getTargetGroupIds(): Promise<string[]> {
        return this.groupRepository.listAll();
    }
}
