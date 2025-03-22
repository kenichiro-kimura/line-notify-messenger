import { IImageStorage } from '@interfaces/imageStorage';

// cloudflare R2をつかって IImageStorage を実装する
export class R2ImageStorage implements IImageStorage {
    private readonly bucket: R2Bucket;
    private readonly origin: string;

    constructor(bucket: R2Bucket, origin: string) {
        if (!bucket) {
            throw new Error("bucket is not set");
        }

        if (!origin || !origin.startsWith("http")){
            throw new Error(`origin is not set: ${origin}`);
        }

        if (origin.endsWith("/")) {
            this.origin = origin.slice(0, -1);
        }
        this.bucket = bucket;
        this.origin = origin;        
    }

    async uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string> {       
        // 画像を R2 にアップロード
        await this.bucket.put(fileName, image, {
            httpMetadata: {
                contentType: contentType
            }
        });

        return `${this.origin}/images/${fileName}`
    }
}