import { IImageStorage } from './interfaces/imageStorage';

export class BlobImageStorage implements IImageStorage {
    private readonly blobName: string;

    constructor(blogName: string){
        this.blobName = blogName;
    }
   
    async uploadImage(fileName:string, image: Buffer, contentType: string): Promise<string> {
        // 一旦モック実装
        return `https://${this.blobName}.example.com/image.jpg`;
    }
}