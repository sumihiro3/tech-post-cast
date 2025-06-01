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
    // 最近の配信番組セクション
    ProgramList.mb-6(
      title="最近の配信番組"
      icon="mdi-radio"
      :programs="recentPrograms"
      @play="playProgram"
      @feed-click="goToFeedPrograms"
      @details="showProgramDetails"
    )
      template(#actions)
        v-btn(color="primary" variant="text" size="small")
          | すべて表示
          v-icon.ml-1 mdi-arrow-right

    // パーソナルフィード概要セクション
    FeedOverview(
      :feeds="personalFeeds"
      @edit="editFeed"
      @create-feed="createFeed"
    )
      template(#actions)
        v-btn(color="primary" variant="text" size="small" to="/app/feeds")
          | フィード設定
          v-icon.ml-1 mdi-cog

  template(#sidebar)
    // サブスクリプション情報セクション
    SubscriptionCard.mb-6

    // クイックアクション
    QuickActions.mb-12(
      :actions="quickActions"
      @action-click="handleActionClick"
    )

  template(#footer)
    // 音声プレイヤー（固定）
    AudioPlayer(
      :current-program="currentProgram"
      :is-playing="isPlaying"
      :current-time="currentTime"
      @toggle-play="togglePlay"
      @time-update="updateCurrentTime"
      @close="closePlayer"
    )
</template>

<script setup lang="ts">
import AudioPlayer from '@/components/dashboard/AudioPlayer.vue';
import DashboardLayout from '@/components/dashboard/DashboardLayout.vue';
import FeedOverview from '@/components/dashboard/FeedOverview.vue';
import ProgramList from '@/components/dashboard/ProgramList.vue';
import QuickActions from '@/components/dashboard/QuickActions.vue';
import StatsCardGrid from '@/components/dashboard/StatsCardGrid.vue';
import SubscriptionCard from '@/components/dashboard/SubscriptionCard.vue';
import { useDashboardStats } from '@/composables/useDashboardStats';
import { useUIState } from '@/composables/useUIState';
import { ref, watch } from 'vue';

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

// エラーハンドリング
watch(statsError, (error) => {
  if (error) {
    ui.showError('統計情報の取得に失敗しました');
  }
});

// 最近の配信番組（仮データ）
const recentPrograms = ref([
  {
    id: 1,
    title: 'React 18の新機能とConcurrent Features',
    date: '2024-01-15',
    duration: '15:30',
    feedName: 'React最新情報',
    feedColor: 'blue',
    isPlaying: false,
  },
  {
    id: 2,
    title: 'TypeScript 5.0のパフォーマンス改善',
    date: '2024-01-14',
    duration: '12:45',
    feedName: 'TypeScript Updates',
    feedColor: 'indigo',
    isPlaying: false,
  },
  {
    id: 3,
    title: 'Vue 3 Composition APIのベストプラクティス',
    date: '2024-01-13',
    duration: '18:20',
    feedName: 'Vue.js情報',
    feedColor: 'green',
    isPlaying: false,
  },
  {
    id: 4,
    title: 'Next.js 14のApp Routerパフォーマンス最適化',
    date: '2024-01-12',
    duration: '14:15',
    feedName: 'Next.js Updates',
    feedColor: 'purple',
    isPlaying: false,
  },
  {
    id: 5,
    title: 'Docker Composeを使った開発環境構築',
    date: '2024-01-11',
    duration: '16:40',
    feedName: 'DevOps情報',
    feedColor: 'orange',
    isPlaying: false,
  },
]);

// パーソナルフィード（仮データ）
const personalFeeds = ref([
  {
    id: 1,
    name: 'React最新情報',
    tagCount: 5,
    authorCount: 12,
    frequency: '日次',
    isActive: true,
  },
  {
    id: 2,
    name: 'TypeScript Updates',
    tagCount: 3,
    authorCount: 8,
    frequency: '週次',
    isActive: true,
  },
  {
    id: 3,
    name: 'Vue.js情報',
    tagCount: 4,
    authorCount: 6,
    frequency: '週次',
    isActive: false,
  },
  {
    id: 4,
    name: 'Next.js Updates',
    tagCount: 6,
    authorCount: 10,
    frequency: '日次',
    isActive: true,
  },
  {
    id: 5,
    name: 'DevOps情報',
    tagCount: 8,
    authorCount: 15,
    frequency: '月次',
    isActive: true,
  },
]);

// 型定義
interface Program {
  id: number;
  title: string;
  date: string;
  duration: string;
  feedName: string;
  feedColor: string;
  isPlaying: boolean;
}

interface ProgramWithTotalTime extends Program {
  totalTime: number;
}

// クイックアクション（仮データ）
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

// 音声プレイヤー関連
const currentProgram = ref<ProgramWithTotalTime | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);

// メソッド
const playProgram = (program: Program): void => {
  if (currentProgram.value?.id === program.id) {
    isPlaying.value = !isPlaying.value;
  } else {
    currentProgram.value = {
      ...program,
      totalTime: 930, // 15:30 in seconds
    };
    isPlaying.value = true;
    currentTime.value = 0;
  }

  // Update program playing state
  recentPrograms.value.forEach((p) => {
    p.isPlaying = p.id === program.id && isPlaying.value;
  });
};

const togglePlay = (): void => {
  isPlaying.value = !isPlaying.value;
  if (currentProgram.value) {
    const program = recentPrograms.value.find((p) => p.id === currentProgram.value!.id);
    if (program) {
      program.isPlaying = isPlaying.value;
    }
  }
};

const updateCurrentTime = (time: number): void => {
  currentTime.value = time;
};

const closePlayer = (): void => {
  currentProgram.value = null;
  isPlaying.value = false;
  currentTime.value = 0;
  recentPrograms.value.forEach((p) => {
    p.isPlaying = false;
  });
};

const showProgramDetails = (program: { title: string }): void => {
  ui.showInfo(`番組詳細: ${program.title}`);
};

const editFeed = (feed: { id: number }): void => {
  navigateTo(`/app/feeds/${feed.id}/edit`);
};

const createFeed = (): void => {
  navigateTo('/app/feeds/create');
};

const goToFeedPrograms = (feedName: string): void => {
  // フィード名で番組一覧を絞り込んで表示
  navigateTo(`/app/programs?feed=${encodeURIComponent(feedName)}`);
};

// 統計カードクリック時の処理
const handleStatClick = (stat: StatItem): void => {
  ui.showInfo(`${stat.title}がクリックされました`);
};

// アクションクリック時の処理
const handleActionClick = (action: QuickAction): void => {
  ui.showInfo(`${action.title}がクリックされました`);
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
