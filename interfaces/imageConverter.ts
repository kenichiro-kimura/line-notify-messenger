interface ImageConverter {
    resizeImage(url: string, width: number, height: number): Promise<Buffer>;
}