import { JimpImageConverter } from '../src/jimpImageConverter';
import { Jimp } from 'jimp';

jest.mock('jimp');

describe('JimpImageConverter', () => {
    let jimpImageConverter: JimpImageConverter;

    beforeEach(() => {
        jimpImageConverter = new JimpImageConverter();
    });

    it('should resize the image if it is larger than the specified dimensions', async () => {
        const mockImage = {
            width: 1000,
            height: 500,
            resize: jest.fn().mockReturnThis(),
            getBuffer: jest.fn().mockResolvedValue(Buffer.from('test buffer'))
        };
        (Jimp.read as jest.Mock).mockResolvedValue(mockImage);

        const result = await jimpImageConverter.resizeImage('http://example.com/image.jpg', 800, 600, 'image/jpeg');

        expect(Jimp.read).toHaveBeenCalledWith('http://example.com/image.jpg');
        expect(mockImage.resize).toHaveBeenCalledWith({ w: 800 });
        expect(mockImage.getBuffer).toHaveBeenCalledWith('image/jpeg');
        expect(result).toEqual(Buffer.from('test buffer'));
    });

    it('should not resize the image if it is smaller than the specified dimensions', async () => {
        const mockImage = {
            width: 500,
            height: 300,
            resize: jest.fn(),
            getBuffer: jest.fn().mockResolvedValue(Buffer.from('test buffer'))
        };
        (Jimp.read as jest.Mock).mockResolvedValue(mockImage);

        const result = await jimpImageConverter.resizeImage('http://example.com/image.jpg', 800, 600, 'image/jpeg');

        expect(Jimp.read).toHaveBeenCalledWith('http://example.com/image.jpg');
        expect(mockImage.resize).not.toHaveBeenCalled();
        expect(mockImage.getBuffer).toHaveBeenCalledWith('image/jpeg');
        expect(result).toEqual(Buffer.from('test buffer'));
    });

    it('should resize the image based on height if the height is larger than the width', async () => {
        const mockImage = {
            width: 500,
            height: 1000,
            resize: jest.fn().mockReturnThis(),
            getBuffer: jest.fn().mockResolvedValue(Buffer.from('test buffer'))
        };
        (Jimp.read as jest.Mock).mockResolvedValue(mockImage);

        const result = await jimpImageConverter.resizeImage('http://example.com/image.jpg', 800, 600, 'image/jpeg');

        expect(Jimp.read).toHaveBeenCalledWith('http://example.com/image.jpg');
        expect(mockImage.resize).toHaveBeenCalledWith({ h: 600 });
        expect(mockImage.getBuffer).toHaveBeenCalledWith('image/jpeg');
        expect(result).toEqual(Buffer.from('test buffer'));
    });
});
