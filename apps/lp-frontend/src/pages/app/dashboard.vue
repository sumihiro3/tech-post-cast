<template lang="pug">
DashboardLayout
  template(#stats)
    // 統計カードセクション
    StatsCardGrid(
      :stats="stats"
      :loading="statsLoading"
      @stat-click="handleStatClick"
    )

  template(#main-content)
    // 最新のパーソナルプログラムセクション
    ProgramListCard.mb-6(
      :programs="programs"
      :total-count="totalCount"
      :loading="programsLoading"
      :error="programsError"
    )

    // パーソナルフィード一覧セクション
    FeedListCard(
      :feeds="feeds"
      :loading="feedsLoading"
      :error="feedsError"
    )

  template(#sidebar)
    // サブスクリプション情報セクション
    SubscriptionCard.mb-6

    // クイックアクション
    QuickActions.mb-12(
      :actions="quickActions"
      @action-click="handleActionClick"
    )

  template(#footer)
    // 音声プレイヤーは削除（ProgramListCardで個別に処理）

    // 開発環境でのみ環境設定情報を表示
    v-card.mt-6(v-if="showEnvironmentInfo" elevation="1")
      v-card-title.text-caption 環境設定情報（開発用）
      v-card-text
        v-chip.mr-2.mb-2(
          v-for="(value, key) in environmentInfo"
          :key="key"
          :color="getChipColor(key, value)"
          size="small"
          variant="flat"
        ) {{ key }}: {{ value }}
</template>

<script setup lang="ts">
import DashboardLayout from '@/components/dashboard/DashboardLayout.vue';
import FeedListCard from '@/components/dashboard/FeedListCard.vue';
import ProgramListCard from '@/components/dashboard/ProgramListCard.vue';
import QuickActions from '@/components/dashboard/QuickActions.vue';
import StatsCardGrid from '@/components/dashboard/StatsCardGrid.vue';
import SubscriptionCard from '@/components/dashboard/SubscriptionCard.vue';
import { useDashboardFeeds } from '@/composables/dashboard/useDashboardFeeds';
import { useDashboardPrograms } from '@/composables/dashboard/useDashboardPrograms';
import { useDashboardStats } from '@/composables/dashboard/useDashboardStats';
import { useUIState } from '@/composables/useUIState';
import { computed, ref, watch } from 'vue';

// レイアウトをuser-appにする
definePageMeta({
  layout: 'user-app',
});

// UI状態管理
const ui = useUIState();

// 統計データの型定義
interface StatItem {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  clickable?: boolean;
  action?: () => void;
}

interface QuickAction {
  title: string;
  icon: string;
  color: string;
  disabled?: boolean;
  badge?: string;
  badgeColor?: string;
  action?: () => void;
}

// 統計データ取得
const {
  stats,
  loading: statsLoading,
  error: statsError,
  refresh: _refreshStats,
} = useDashboardStats();

// プログラムデータ取得
const {
  programs,
  totalCount,
  loading: programsLoading,
  error: programsError,
} = useDashboardPrograms({ limit: 5 });

// フィードデータ取得
const { feeds, loading: feedsLoading, error: feedsError } = useDashboardFeeds();

// エラーハンドリング
watch(statsError, (error) => {
  if (error) {
    ui.showError('統計情報の取得に失敗しました');
  }
});

watch(programsError, (error) => {
  if (error) {
    ui.showError('プログラム一覧の取得に失敗しました');
  }
});

watch(feedsError, (error) => {
  if (error) {
    ui.showError('フィード一覧の取得に失敗しました');
  }
});

// クイックアクション
const quickActions = ref<QuickAction[]>([
  {
    title: '新しいフィードを作成',
    icon: 'mdi-plus',
    color: 'primary',
    action: (): void => {
      navigateTo('/app/feeds/create');
    },
  },
  {
    title: 'フィード設定を編集',
    icon: 'mdi-pencil',
    color: 'secondary',
    action: (): void => {
      navigateTo('/app/feeds');
    },
  },
  {
    title: 'ユーザー設定',
    icon: 'mdi-account-cog',
    color: 'info',
    action: (): void => {
      navigateTo('/app/settings');
    },
  },
]);

// 統計カードクリック時の処理
const handleStatClick = (stat: StatItem): void => {
  ui.showInfo(`${stat.title}がクリックされました`);
};

// アクションクリック時の処理
const handleActionClick = (action: QuickAction): void => {
  ui.showInfo(`${action.title}がクリックされました`);
};

// 環境情報表示（開発環境のみ）
const showEnvironmentInfo = computed(() => isDevelopment());
const environmentInfo = computed(() => {
  const { isSignedIn, userId } = useAuth();
  return {
    ...getEnvironmentInfo(),
    isSignedIn: isSignedIn.value,
    userId: userId.value || 'N/A',
  };
});

// チップの色を決定する関数
const getChipColor = (key: string, value: unknown): string => {
  if (key === 'isDevelopment' && value === true) return 'info';
  if (key === 'isProduction' && value === true) return 'success';
  return 'default';
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-btn {
  text-transform: none;
}

.v-chip {
  font-weight: 500;
}

.cursor-pointer {
  cursor: pointer;
}

.border-t {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.player-footer {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.v-progress-linear {
  border-radius: 4px;
}
</style>
