import { IImageStorage } from '@interfaces/imageStorage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// cloudflare R2をつかって IImageStorage を実装する
export class R2ImageStorage implements IImageStorage {
    private readonly bucketName: string;
    private readonly region: string;
    private readonly client: S3Client;

    constructor(bucketName: string, region: string, accountId?: string, accessKeyId?: string, secretAccessKey?: string) {
        if (!bucketName || !region) {
            throw new Error("bucket name or region is not set");
        }

        this.bucketName = bucketName;
        this.region = region;
        
        // R2用のS3クライアントを作成
        this.client = new S3Client({
            region: this.region,
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId || process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: secretAccessKey || process.env.R2_SECRET_ACCESS_KEY || ''
            }
        });
    }

    async uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string> {       
        // 画像を R2 にアップロード
        await this.client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: image,
            ContentType: contentType
        }));

        // R2のパブリックURLを返す
        return `https://${this.bucketName}.${this.region}.r2.cloudflarestorage.com/${fileName}`;
    }
}