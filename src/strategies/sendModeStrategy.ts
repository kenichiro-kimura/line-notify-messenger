import { SendMode, ISendModeStrategy } from '@interfaces/sendModeStrategy';

/**
 * デフォルトの送信モード決定ストラテジーの実装クラス
 * 常にブロードキャスト送信モードを返します
 */
export class DefaultSendModeStrategy implements ISendModeStrategy {
    /**
     * ブロードキャスト送信モードを常に返します
     * @returns ブロードキャスト送信モード（SendMode.broadcast）
     */
    getSendMode(): SendMode {
        return SendMode.broadcast;
    }
}

/**
 * 環境変数ベースの送信モード決定ストラテジーの実装クラス
 * SEND_MODE環境変数から送信モードを決定します
 * 環境変数が未設定または無効な値の場合はデフォルト値を返します
 */
export class EnvironmentSendModeStrategy implements ISendModeStrategy {
    /**
     * 環境変数SEND_MODEから送信モードを取得します
     * 環境変数が未設定または無効な値の場合はブロードキャストモードを返します
     * 
     * @returns 環境変数から決定した送信モード
     */
    getSendMode(): SendMode {
        const mode = process.env.SEND_MODE || SendMode.broadcast;
        if (!Object.values(SendMode).includes(mode as SendMode)) {
            return SendMode.broadcast;
        }
        return mode as SendMode;
    }
}
