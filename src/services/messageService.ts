/* eslint-disable  @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { SendMode } from '@interfaces/sendModeStrategy';
import LineService from '@services/lineService';
import { GroupService } from '@services/groupService';
import { ISendModeStrategy } from '@interfaces/sendModeStrategy';
import { inject, injectable } from 'tsyringe';

/**
 * メッセージ送信処理を担当するサービスクラス
 * 送信モードに応じたLINEメッセージの配信ロジックを提供します
 */
@injectable()
export class MessageService {
    /** LINE Messaging API連携サービス */
    private lineService: LineService;
    /** グループ管理サービス */
    private groupService: GroupService;
    /** メッセージ送信モード決定ストラテジー */
    private sendModeStrategy: ISendModeStrategy;

    /**
     * MessageServiceのコンストラクタ
     * @param lineService LINE API連携サービス
     * @param groupService グループ管理サービス
     * @param sendModeStrategy 送信モード決定ストラテジー
     */
    constructor(
        @inject('LineService') lineService: LineService,
        @inject('IGroupService') groupService: GroupService,
        @inject('ISendModeStrategy') sendModeStrategy: ISendModeStrategy
    ) {
        this.lineService = lineService;
        this.groupService = groupService;
        this.sendModeStrategy = sendModeStrategy;
    }

    /**
     * 現在設定されている送信モードを取得します
     * @returns 現在の送信モード（broadcast, group, all）
     */
    getSendMode(): SendMode {
        return this.sendModeStrategy.getSendMode();
    }

    /**
     * ブロードキャスト送信を実行します
     * 登録されている全友達にメッセージを送信します
     * 
     * @param formData 送信するメッセージデータ
     * @returns 処理完了を表すPromise
     */
    private async sendBroadcastMessage(formData: any): Promise<void> {
        await this.lineService.broadcastMessage(formData);
    }

    /**
     * グループ送信を実行します
     * 登録されている全グループにメッセージを送信します
     * 
     * @param formData 送信するメッセージデータ
     * @returns 処理完了を表すPromise
     */
    private async sendGroupMessage(formData: any): Promise<void> {
        const groupIds: string[] = await this.groupService.getTargetGroupIds();
        console.log(`groupIds: ${groupIds}`);
        if (groupIds.length > 0) {
            await this.lineService.groupMessage(groupIds, formData);
        }
    }

    /**
     * 指定された送信モードに基づいてメッセージを送信します
     * broadcast: ブロードキャスト送信
     * group: グループ送信
     * all: ブロードキャストとグループの両方に送信
     * 
     * @param formData 送信するメッセージデータ
     * @returns 処理完了を表すPromise
     */
    async sendMessage(formData: any): Promise<void> {
        const sendMode: SendMode = this.getSendMode();
        switch (sendMode) {
            case SendMode.broadcast:
                await this.sendBroadcastMessage(formData);
                break;
            case SendMode.group:
                await this.sendGroupMessage(formData);
                break;
            case SendMode.all:
                await this.sendBroadcastMessage(formData);
                await this.sendGroupMessage(formData);
                break;
        }
    }

    /**
     * ユーザーからのメッセージに対してデフォルトの応答を送信します
     * 
     * @param body LINEウェブフックのリクエストボディ
     * @returns 処理完了を表すPromise
     */
    async replyDefaultMessage(body: any): Promise<void> {
        const replyToken = body.events[0].replyToken;
        await this.lineService.replyMessage(
            replyToken,
            'お送り頂いたメッセージはどこにも送られないのでご注意ください'
        );
    }
}
