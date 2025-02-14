interface ImageStorage {
    uploadImage(fileName: String, image: Buffer, contentType: string): Promise<string>;
}
