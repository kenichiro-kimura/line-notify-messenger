/**
 * 画像変換機能を提供するインターフェース
 * 画像のリサイズや形式変換などの操作を定義します
 */
export interface IImageConverter {
    /**
     * 画像をリサイズします
     * 指定されたURL、サイズ、コンテンツタイプに基づいて画像を変換します
     * 
     * @param image - 変換対象の画像(Buffer)
     * @param width - 変換後の画像の幅（ピクセル）
     * @param height - 変換後の画像の高さ（ピクセル）
     * @param contentType - 画像のコンテンツタイプ（MIME Type）
     * @returns 変換された画像データのBufferを含むPromise
     */
    resizeImage(
        image: Buffer, 
        width: number, 
        height: number, 
        contentType: 'image/bmp' | 'image/tiff' | 'image/x-ms-bmp' | 'image/gif' | 'image/jpeg' | 'image/png'
    ): Promise<Buffer>;
}
