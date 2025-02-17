export interface IImageStorage {
    uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string>;
}
