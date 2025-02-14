interface ImageConverter {
    resizeImage(url: string, width: number, height: number, contentType: 'image/bmp' | 'image/tiff' | 'image/x-ms-bmp' | 'image/gif' | 'image/jpeg' | 'image/png'): Promise<Buffer>;
}

export { ImageConverter };