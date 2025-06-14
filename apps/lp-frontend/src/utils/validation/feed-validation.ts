/**
 * パーソナルフィード設定のバリデーション関数群
 */

import type { InputPersonalizedFeedData } from '@/types/personalized-feed';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 番組タイトルのバリデーション
 */
export const validateProgramTitle = (title: string): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須チェック
  if (!title || title.trim() === '') {
    errors.push('番組タイトルを入力してください');
  } else {
    // 長さチェック
    if (title.length < 3) {
      errors.push('番組タイトルは3文字以上で入力してください');
    }
    if (title.length > 100) {
      errors.push('番組タイトルは100文字以内で入力してください');
    }

    // 文字種チェック
    if (title.trim().length !== title.length) {
      warnings.push('番組タイトルの前後に不要な空白があります');
    }

    // 特殊文字チェック
    const invalidChars = /[<>"'&]/;
    if (invalidChars.test(title)) {
      errors.push('番組タイトルに使用できない文字が含まれています（< > " \' &）');
    }

    // 推奨事項
    if (title.length > 50) {
      warnings.push('番組タイトルが長すぎる可能性があります（50文字以内を推奨）');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * タグフィルターのバリデーション
 */
export const validateTagsFilter = (tags: string[], maxTags: number = 10): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 個数チェック
  if (tags.length > maxTags) {
    errors.push(`タグは${maxTags}個まで選択できます`);
  }

  // 重複チェック
  const uniqueTags = new Set(tags);
  if (uniqueTags.size !== tags.length) {
    warnings.push('重複するタグが選択されています');
  }

  // 個別タグのバリデーション
  tags.forEach((tag, index) => {
    if (!tag || tag.trim() === '') {
      errors.push(`${index + 1}番目のタグが空です`);
    } else if (tag.length > 50) {
      errors.push(`タグ「${tag}」が長すぎます（50文字以内）`);
    }
  });

  // 推奨事項（最大数の半分を推奨値とする）
  const recommendedMax = Math.max(1, Math.floor(maxTags / 2));
  if (tags.length > recommendedMax) {
    warnings.push(
      `タグが多すぎると記事が見つからない可能性があります（${recommendedMax}個以内を推奨）`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * 著者フィルターのバリデーション
 */
export const validateAuthorsFilter = (
  authors: string[],
  maxAuthors: number = 10,
): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 個数チェック
  if (authors.length > maxAuthors) {
    errors.push(`著者は${maxAuthors}人まで選択できます`);
  }

  // 重複チェック
  const uniqueAuthors = new Set(authors);
  if (uniqueAuthors.size !== authors.length) {
    warnings.push('重複する著者が選択されています');
  }

  // 個別著者のバリデーション
  authors.forEach((author, index) => {
    if (!author || author.trim() === '') {
      errors.push(`${index + 1}番目の著者が空です`);
    } else if (author.length > 100) {
      errors.push(`著者「${author}」が長すぎます（100文字以内）`);
    }
  });

  // 推奨事項（最大数の半分を推奨値とする）
  const recommendedMax = Math.max(1, Math.floor(maxAuthors / 2));
  if (authors.length > recommendedMax) {
    warnings.push(
      `著者が多すぎると記事が見つからない可能性があります（${recommendedMax}人以内を推奨）`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * いいね数フィルターのバリデーション
 */
export const validateLikesCountFilter = (likesCount: number): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 範囲チェック
  if (likesCount < 0) {
    errors.push('いいね数は0以上で設定してください');
  }
  if (likesCount > 1000) {
    errors.push('いいね数は1000以下で設定してください');
  }

  // 推奨事項
  if (likesCount > 100) {
    warnings.push('いいね数が高すぎると記事が見つからない可能性があります');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * 日付範囲フィルターのバリデーション
 */
export const validateDateRangeFilter = (dateRange: number): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須チェック
  if (dateRange === undefined || dateRange === null) {
    errors.push('記事公開日の範囲を選択してください');
  } else {
    // 範囲チェック
    const validRanges = [1, 3, 7, 14, 30];
    if (!validRanges.includes(dateRange)) {
      errors.push('記事公開日の範囲は指定された選択肢から選んでください');
    }

    // 推奨事項
    if (dateRange > 30) {
      warnings.push('日付範囲が長すぎると古い記事が含まれる可能性があります');
    }
    if (dateRange < 3) {
      warnings.push('日付範囲が短すぎると記事が見つからない可能性があります');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * フィルター条件の組み合わせバリデーション
 */
export const validateFilterCombination = (
  tags: string[],
  authors: string[],
  likesCount: number,
  dateRange: number,
  maxTags: number = 10,
  maxAuthors: number = 10,
): FieldValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 最低限のフィルター条件チェック
  if (tags.length === 0 && authors.length === 0) {
    errors.push('タグまたは著者のいずれかのフィルターを設定してください');
  }

  // 条件が厳しすぎる場合の警告（推奨値の60%を基準とする）
  const strictTagThreshold = Math.max(1, Math.floor(maxTags * 0.6));
  const strictAuthorThreshold = Math.max(1, Math.floor(maxAuthors * 0.6));

  const hasStrictConditions =
    tags.length > strictTagThreshold ||
    authors.length > strictAuthorThreshold ||
    likesCount > 50 ||
    dateRange < 7;

  if (hasStrictConditions) {
    warnings.push(
      'フィルター条件が厳しすぎる可能性があります。記事が見つからない場合は条件を緩めてください',
    );
  }

  // 条件が緩すぎる場合の警告
  const hasLooseConditions =
    (tags.length === 0 && authors.length === 0) || (likesCount === 0 && dateRange > 30);

  if (hasLooseConditions && tags.length > 0 && authors.length > 0) {
    warnings.push(
      'フィルター条件が緩すぎる可能性があります。より具体的な条件を設定することを推奨します',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * フィード全体のバリデーション
 */
export const validateFeedData = (
  feedData: InputPersonalizedFeedData,
  options: {
    maxTags?: number;
    maxAuthors?: number;
  } = {},
): ValidationResult => {
  const { maxTags = 10, maxAuthors = 10 } = options;
  const allErrors: Record<string, string[]> = {};
  const allWarnings: Record<string, string[]> = {};

  // 各フィールドのバリデーション
  const titleResult = validateProgramTitle(feedData.programTitle);
  if (titleResult.errors.length > 0) allErrors.programTitle = titleResult.errors;
  if (titleResult.warnings.length > 0) allWarnings.programTitle = titleResult.warnings;

  const tagsResult = validateTagsFilter(feedData.filters.tags || [], maxTags);
  if (tagsResult.errors.length > 0) allErrors.tags = tagsResult.errors;
  if (tagsResult.warnings.length > 0) allWarnings.tags = tagsResult.warnings;

  const authorsResult = validateAuthorsFilter(feedData.filters.authors || [], maxAuthors);
  if (authorsResult.errors.length > 0) allErrors.authors = authorsResult.errors;
  if (authorsResult.warnings.length > 0) allWarnings.authors = authorsResult.warnings;

  const likesResult = validateLikesCountFilter(feedData.filters.likesCount || 0);
  if (likesResult.errors.length > 0) allErrors.likesCount = likesResult.errors;
  if (likesResult.warnings.length > 0) allWarnings.likesCount = likesResult.warnings;

  const dateRangeResult = validateDateRangeFilter(feedData.filters.dateRange);
  if (dateRangeResult.errors.length > 0) allErrors.dateRange = dateRangeResult.errors;
  if (dateRangeResult.warnings.length > 0) allWarnings.dateRange = dateRangeResult.warnings;

  // フィルター組み合わせのバリデーション
  const combinationResult = validateFilterCombination(
    feedData.filters.tags || [],
    feedData.filters.authors || [],
    feedData.filters.likesCount || 0,
    feedData.filters.dateRange,
    maxTags,
    maxAuthors,
  );
  if (combinationResult.errors.length > 0) allErrors.filterCombination = combinationResult.errors;
  if (combinationResult.warnings.length > 0)
    allWarnings.filterCombination = combinationResult.warnings;

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
};

/**
 * リアルタイムバリデーション用のデバウンス関数
 */
export const createDebouncedValidator = (
  validationFn: (
    data: InputPersonalizedFeedData,
    options?: { maxTags?: number; maxAuthors?: number },
  ) => ValidationResult,
  delay: number = 500,
): ((
    data: InputPersonalizedFeedData,
    callback: (result: ValidationResult) => void,
    options?: { maxTags?: number; maxAuthors?: number },
  ) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (
    data: InputPersonalizedFeedData,
    callback: (result: ValidationResult) => void,
    options?: { maxTags?: number; maxAuthors?: number },
  ) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validationFn(data, options);
      callback(result);
    }, delay);
  };
};
