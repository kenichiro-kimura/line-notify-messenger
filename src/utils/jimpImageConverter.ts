import { IImageConverter } from '@interfaces/imageConverter';
import { Jimp } from 'jimp';

/**
 * Jimpライブラリを使用した画像変換機能の実装クラス
 * IImageConverterインターフェースを実装し、画像のリサイズや形式変換を提供します
 */
export class JimpImageConverter implements IImageConverter {
    /**
     * 画像をリサイズします
     * 指定された最大幅・高さに収まるように、アスペクト比を保持したままリサイズします
     * 
     * @param url - リサイズする画像のURL
     * @param width - リサイズ後の最大幅（ピクセル）
     * @param height - リサイズ後の最大高さ（ピクセル）
     * @param contentType - 出力する画像の形式
     * @returns リサイズされた画像のBufferを含むPromise
     */
    async resizeImage(
        originalImage: Buffer, 
        width: number, 
        height: number, 
        contentType: 'image/bmp' | 'image/tiff' | 'image/x-ms-bmp' | 'image/gif' | 'image/jpeg' | 'image/png'
    ): Promise<Buffer> {
        // Bufferから画像を読み込む
        const image = await Jimp.read(Buffer.from(originalImage));
        const imageWidth = image.width;
        const imageHeight = image.height;
        // 画像が指定サイズより大きい場合のみリサイズを実行
        if (imageWidth > width || imageHeight > height) {
            // 横長画像の場合は幅に合わせてリサイズ
            if (imageWidth > imageHeight) {
                image.resize({ w: width });
            } 
            // 縦長画像の場合は高さに合わせてリサイズ
            else {
                image.resize({ h: height });
            }
        }
        
        // 指定された形式のBufferを返す
        return await image.getBuffer(contentType);
    }
}
