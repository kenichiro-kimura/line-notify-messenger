import { IImageStorage } from './interfaces/imageStorage';
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

export class BlobImageStorage implements IImageStorage {
  private readonly containerClient: ContainerClient;
  private readonly sharedKeyCredential: StorageSharedKeyCredential;

  /**
   * コンストラクタ
   * @param connectionString Azure Blob Storage の接続文字列
   * @param containerName アップロード先のコンテナ名
   */
  constructor(connectionString: string, containerName: string) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(containerName);

    // 接続文字列から AccountName と AccountKey を抽出
    const segments = connectionString.split(';');
    const accountNameSegment = segments.find(segment => segment.startsWith("AccountName="));
    const accountKeySegment = segments.find(segment => segment.startsWith("AccountKey="));

    // 接続文字列から AccountName と AccountKey を抽出
    const accountName = accountNameSegment?.split('=')[1];
    const accountKey = accountKeySegment?.split('=')[1];

    if (!accountName || !accountKey) {
      throw new Error("Invalid connection string");
    }
    this.sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  }

  /**
   * 画像を Azure Blob Storage にアップロードし、7日間有効な読み込みSAS付きのURLを返す
   * @param fileName アップロード先のファイル名
   * @param image 画像データ（Buffer）
   * @param contentType 画像のContent-Type
   * @returns Promise<string> アップロード後のSAS付き画像URL
   */
  async uploadImage(fileName: string, image: Buffer, contentType: string): Promise<string> {
    // コンテナが存在しなければ作成する（すでに存在する場合は何もしない）
    await this.containerClient.createIfNotExists({ access: 'container' });
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(image, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    // SAS トークンの生成: 読み込み用、開始時刻はすぐ、終了時刻は7日後
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const sasToken = generateBlobSASQueryParameters({
      containerName: this.containerClient.containerName,
      blobName: fileName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(),
      expiresOn: expiryDate,
    }, this.sharedKeyCredential).toString();

    // SAS URL を組み立てて返す
    return `${blockBlobClient.url}?${sasToken}`;
  }
}