import { IImageStorage } from '@interfaces/imageStorage';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Amazon S3を使用した画像ストレージの実装クラス
 * IImageStorageインターフェースを実装し、S3バケットに画像を保存・取得する機能を提供します
 */
export class S3ImageStorage implements IImageStorage {
    /** S3バケット名 */
    private readonly bucketName: string;
    /** AWS リージョン */
    private readonly region: string;

    /**
     * S3ImageStorageのコンストラクタ
     * @param bucketName 画像を保存するS3バケット名
     * @param region AWS リージョン（例: 'us-east-1'）
     * @throws バケット名またはリージョンが設定されていない場合にエラーをスローします
     */
    constructor(bucketName: string, region: string) {
        if (!bucketName || !region) {
            throw new Error("bucket name or region is not set");
        }

        this.bucketName = bucketName;
        this.region = region;
    }

    /**
     * 画像をAmazon S3にアップロードし、7日間有効な署名付きURLを返します
     * 
     * @param fileName アップロード先のファイル名
     * @param image 画像データ（Buffer）
     * @param contentType 画像のContent-Type
     * @returns アップロード後の署名付き画像URL
     */
    async uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string> {
        const s3Client = new S3Client({ region: this.region });

        // 画像を S3 にアップロード
        await s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: image,
            ContentType: contentType
        }));

        // 7日間有効な署名付きURL（秒数に換算すると 7*24*60*60）
        const expiresIn = 7 * 24 * 60 * 60;
        const originalUrl = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: this.bucketName,
            Key: fileName
        }), { expiresIn: expiresIn });

        return originalUrl;
    }
}