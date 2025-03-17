import { S3ImageStorage } from '@repositories/s3ImageStorage';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3ImageStorage', () => {
    const bucketName = 'test-bucket';
    const region = 'test-region';
    const fileName = 'test-image.png';
    const image = Buffer.from('test-image');
    const contentType = 'image/png';

    let s3ImageStorage: S3ImageStorage;

    beforeEach(() => {
        s3ImageStorage = new S3ImageStorage(bucketName, region);
    });

    it('should upload image and return signed URL', async () => {
        const mockSend = jest.fn();
        S3Client.prototype.send = mockSend;

        const mockGetSignedUrl = getSignedUrl as jest.Mock;
        const signedUrl = 'https://signed-url.com';
        mockGetSignedUrl.mockResolvedValue(signedUrl);

        const result = await s3ImageStorage.uploadImage(fileName, image, contentType);

        expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
        expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.any(S3Client), expect.any(GetObjectCommand), { expiresIn: 7 * 24 * 60 * 60 }); // 7 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute
        expect(result).toBe(signedUrl);
    });

    it('should throw error if bucket name or region is not set', () => {
        expect(() => new S3ImageStorage('', region)).toThrow('bucket name or region is not set');
        expect(() => new S3ImageStorage(bucketName, '')).toThrow('bucket name or region is not set');
    });
});
