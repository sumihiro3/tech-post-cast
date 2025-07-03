/**
 * Slack Webhook URLのテスト機能を提供するcomposable
 *
 * @description
 * Slack Webhook URLの接続テスト機能を提供します。
 * テスト実行、結果の状態管理、エラーハンドリングを統合的に管理します。
 */

import type { TestSlackWebhookResponseDto } from '@/api';
import { ref, type Ref } from 'vue';

/**
 * useSlackWebhookTest composable の戻り値の型定義
 */
export interface UseSlackWebhookTestReturn {
  testing: Ref<boolean>;
  testResult: Ref<TestSlackWebhookResponseDto | null>;
  error: Ref<string | null>;
  testWebhook: (webhookUrl: string) => Promise<boolean>;
  clearResult: () => void;
}

/**
 * Slack Webhook URLテスト管理のcomposable
 *
 * @returns {UseSlackWebhookTestReturn} Slack Webhook URLテストに必要な状態と関数
 */
export const useSlackWebhookTest = (): UseSlackWebhookTestReturn => {
  const { $userSettingsApi } = useNuxtApp();

  // 状態管理
  const testing = ref<boolean>(false);
  const testResult = ref<TestSlackWebhookResponseDto | null>(null);
  const error = ref<string | null>(null);

  /**
   * Slack Webhook URLをテスト
   *
   * @param {string} webhookUrl - テストするWebhook URL
   * @returns {Promise<boolean>} テストが成功した場合はtrue
   */
  const testWebhook = async (webhookUrl: string): Promise<boolean> => {
    testing.value = true;
    error.value = null;
    testResult.value = null;

    try {
      // URL形式の基本バリデーション
      if (!webhookUrl || webhookUrl.trim() === '') {
        error.value = 'Webhook URLを入力してください';
        return false;
      }

      try {
        const urlObj = new URL(webhookUrl);
        if (!urlObj.hostname.includes('hooks.slack.com')) {
          error.value = '正しいSlack Webhook URLを入力してください';
          return false;
        }
      } catch {
        error.value = '正しいSlack Webhook URLを入力してください';
        return false;
      }

      const response = await $userSettingsApi.userSettingsControllerTestSlackWebhook({
        webhookUrl,
      });

      testResult.value = response.data;

      if (response.data.success) {
        return true;
      } else {
        error.value = response.data.errorMessage || 'テストに失敗しました';
        return false;
      }
    } catch (err: unknown) {
      console.error('Slack Webhook URLのテストに失敗しました:', err);
      error.value = 'Slack Webhook URLのテストに失敗しました';
      return false;
    } finally {
      testing.value = false;
    }
  };

  /**
   * テスト結果をクリア
   */
  const clearResult = (): void => {
    testResult.value = null;
    error.value = null;
  };

  return {
    testing,
    testResult,
    error,
    testWebhook,
    clearResult,
  };
};
