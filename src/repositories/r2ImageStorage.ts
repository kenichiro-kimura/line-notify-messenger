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

        const maxAttempts = 5;
        const delay = 500; // ms
      
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const object = await this.bucket.get(fileName);
            if (object) {
              return `${this.origin}/images/${fileName}`;
            }            
          } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        throw new Error(`Failed to upload image: ${fileName}`);
    }
}