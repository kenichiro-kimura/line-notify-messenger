import { IImageStorage } from '../interfaces/imageStorage';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3ImageStorage implements IImageStorage {
    bucketName: string;
    region: string;

    constructor(bucketName: string, region: string) {
        if (!bucketName || !region) {
            throw new Error("bucket name or region is not set");
        }

        this.bucketName = bucketName;
        this.region = region;
    }

    async uploadImage(fileName:string, image: Buffer, contentType: string): Promise<string> {
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