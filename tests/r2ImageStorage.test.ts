/* eslint-disable  @typescript-eslint/no-explicit-any */
import { R2ImageStorage } from '@repositories/r2ImageStorage';

describe('R2ImageStorage', () => {
  const origin = 'https://example.com';
  const fileName = 'test-image.png';
  const image = Buffer.from('test-image');
  const contentType = 'image/png';

  // R2Bucket のモック作成
  const mockBucket = {
    put: jest.fn().mockResolvedValue(undefined),
    get: jest.fn()
  };

  let r2ImageStorage: R2ImageStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    r2ImageStorage = new R2ImageStorage(mockBucket as any, origin);
  });

  it('should initialize correctly', () => {
    expect(r2ImageStorage).toBeDefined();
  });

  it('should throw error if bucket is not set', () => {
    expect(() => new R2ImageStorage(null as any, origin)).toThrow('bucket is not set');
  });

  it('should throw error if origin is not set', () => {
    expect(() => new R2ImageStorage(mockBucket as any, '')).toThrow('origin is not set');
    expect(() => new R2ImageStorage(mockBucket as any, 'invalid-url')).toThrow('origin is not set');
  });

  it('should remove trailing slash from origin', () => {
    const storageWithTrailingSlash = new R2ImageStorage(mockBucket as any, 'https://example.com/');
    expect((storageWithTrailingSlash as any).origin).toBe('https://example.com');
  });

  it('should upload image and return URL', async () => {
    // R2バケットのgetメソッドがファイルを見つけるようにモック
    mockBucket.get.mockResolvedValue({
      body: new ArrayBuffer(0),
      httpEtag: 'etag123'
    });

    const result = await r2ImageStorage.uploadImage(fileName, image, contentType);

    // putが正しく呼ばれたか確認
    expect(mockBucket.put).toHaveBeenCalledWith(
      fileName, 
      image, 
      {
        httpMetadata: {
          contentType: contentType
        }
      }
    );

    // getが呼ばれたか確認
    expect(mockBucket.get).toHaveBeenCalledWith(fileName);
    
    // 正しいURLが返ってきたか確認
    expect(result).toBe(`${origin}/images/${fileName}`);
  });
 });