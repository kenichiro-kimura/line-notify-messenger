/**
 * 画像ストレージ機能を提供するインターフェース
 * 画像データの保存および取得に関する操作を定義します
 */
export interface IImageStorage {
    /**
     * 画像データをストレージにアップロードします
     * 
     * @param fileName - 保存する画像のファイル名
     * @param image - アップロードする画像データのバッファ
     * @param contentType - 画像のコンテンツタイプ（MIME Type）
     * @returns アップロードされた画像のURLを含むPromise
     */
    uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string>;
}
