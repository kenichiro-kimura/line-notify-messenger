import { BlobImageStorage } from '../src/blobImageStorage';
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, BlobSASPermissions } from '@azure/storage-blob';

describe('BlobImageStorage', () => {
    const connectionString = 'AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;DefaultEndpointsProtocol=http;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
    const containerName = 'test-container';
    const fileName = 'test-image.png';
    const image = Buffer.from('test-image');
    const contentType = 'image/png';

    let blobImageStorage: BlobImageStorage;

    beforeEach(() => {
        blobImageStorage = new BlobImageStorage(connectionString, containerName);
    });

    it('should upload image and return SAS URL', async () => {
        const mockUploadData = jest.fn();
        const mockCreateIfNotExists = jest.fn();
        const mockGetBlockBlobClient = jest.fn().mockImplementation(() => {
            return {
                uploadData: mockUploadData,
                url: 'blob-url'
            };
        });
        BlobServiceClient.fromConnectionString = jest.fn().mockImplementation(() => {
            return {
                getContainerClient: jest.fn()
            };
        }) as jest.Mock<BlobServiceClient>;

        BlobServiceClient.prototype.getContainerClient = jest.fn() as jest.Mock<ContainerClient>;        
        const mockGenerateBlobSASQueryParameters = jest.fn().mockImplementation(() => {
            return { toString: () => 'sas-token' };
        });
        ContainerClient.prototype.createIfNotExists = mockCreateIfNotExists;
        ContainerClient.prototype.getBlockBlobClient = mockGetBlockBlobClient;
        
        jest.spyOn(require('@azure/storage-blob'), 'generateBlobSASQueryParameters').mockImplementation(mockGenerateBlobSASQueryParameters);

        const result = await blobImageStorage.uploadImage(fileName, image, contentType);

        expect(mockCreateIfNotExists).toHaveBeenCalled();
        expect(mockGetBlockBlobClient).toHaveBeenCalledWith(fileName);
        expect(mockUploadData).toHaveBeenCalledWith(image, { blobHTTPHeaders: { blobContentType: contentType } });
        expect(result).toBe(`${mockGetBlockBlobClient().url}?sas-token`);
    });

    it('should throw error if connection string is invalid', () => {
        expect(() => new BlobImageStorage('InvalidConnectionString', containerName)).toThrow('Invalid connection string');
    });
});
