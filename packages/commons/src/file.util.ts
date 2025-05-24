import * as fs from 'fs';

/**
 * 指定のディレクトリを作成する
 * @param path ディレクトリパス
 */
export const createDir = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};
