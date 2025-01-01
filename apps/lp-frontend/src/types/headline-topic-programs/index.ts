import type { HeadlineTopicProgramDto } from '@/api';

/**
 * 指定ページで表示するヘッドライントピック番組の一覧と最大ページ数を保持する型
 */
export interface CurrentPageHeadlineTopicPrograms {
  /**
   * ヘッドライントピック番組の一覧
   */
  programs: HeadlineTopicProgramDto[];
  /**
   * 最大ページ数
   */
  pages: number;
  /**
   * 現在のページ番号
   */
  currentPage: number;
}
