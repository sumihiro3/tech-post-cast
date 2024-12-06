import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Readable } from 'stream';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      log: ['query'],
      datasources: {
        db: {
          url: config.get<string>(`DATABASE_URL`),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * CSVをダウンロードするための ReadableStream を作成する
   * @param getRecords Prisma でレコードを取得する処理
   * @param fetchRow レコードを取得した後に、レコードからCSVの項目を取得する処理
   * @param header CSVのヘッダー
   * @param encoding 文字コード
   * @param addBom BOM を追加するかどうか
   * @returns ReadableStream
   */
  public $createReadableStream<Record>(
    getRecords: (prisma: PrismaService) => Record[] | Promise<Record[]>,
    fetchRow: (row: Record) => Buffer | Uint8Array,
    header: string[] = [],
    encoding: BufferEncoding = 'utf-8',
    addBom = false,
  ): Readable {
    let buffer: Record[] = [];
    let size = 0;
    let needsToAddBom = false;
    let needsToAddHeader = false;
    const getItems = async (): Promise<boolean> => {
      const res = await getRecords(this);
      if (!res || res === null || (Array.isArray(res) && res.length === 0)) {
        return false;
      }
      buffer = res;
      // BOM をつけるかどうかの判定
      if (size === 0 && addBom) {
        needsToAddBom = true;
      }
      // ヘッダーを追加するかどうかの判定
      if (size === 0 && header.length > 0) {
        needsToAddHeader = true;
      }
      size += buffer.length;
      return true;
    };
    return new Readable({
      encoding,
      objectMode: true,
      async read() {
        if (buffer.length === 0) {
          if (!(await getItems())) {
            this.push(null);
            return;
          }
        }
        const value = buffer.shift();
        if (!value) {
          this.push(null);
          return;
        }
        if (needsToAddBom) {
          // BOM 追加が設定されている場合、先頭に BOM を追加する
          needsToAddBom = false;
          this.push(Buffer.from('\uFEFF'));
        }
        if (needsToAddHeader) {
          // ヘッダー追加が設定されている場合、ヘッダーを追加する
          needsToAddHeader = false;
          this.push(Buffer.from(`${header.join(',')}\n`));
        }
        this.push(fetchRow(value));
      },
    });
  }
}
