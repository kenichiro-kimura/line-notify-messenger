import { IImageConverter } from './interfaces/imageConverter';
import { Jimp } from 'jimp';
    
export class JimpImageConverter implements IImageConverter {
    async resizeImage(url: string, width: number, height: number, contentType: 'image/bmp' | 'image/tiff' | 'image/x-ms-bmp' | 'image/gif' | 'image/jpeg' | 'image/png'): Promise<Buffer> {
        const image = await Jimp.read(url);
        const imageWidth = image.width;
        const imageHeight = image.height;
        if (imageWidth > width || imageHeight > height) {
            if (imageWidth > imageHeight) {
                image.resize({ w:width });
            } else {
                image.resize({ h:height });
            }
        }
        return await image.getBuffer(contentType);
    }
}
