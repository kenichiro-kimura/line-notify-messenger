interface ImageStorage {
    uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string>;
}

export { ImageStorage };
