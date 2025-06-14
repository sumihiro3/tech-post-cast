import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  /**
   * Qiita API トークン
   */
  get QiitaAccessToken(): string {
    return this.configService.get<string>('QIITA_API_ACCESS_TOKEN', '');
  }

  /**
   * Free Plan ID
   */
  get FreePlanId(): string {
    return this.configService.get<string>('FREE_PLAN_ID', '');
  }

  /**
   * Pro Plan ID
   */
  get ProPlanId(): string {
    return this.configService.get<string>('PRO_PLAN_ID', '');
  }

  /**
   * RSS配信用URLプレフィックス
   */
  get RssUrlPrefix(): string {
    return this.configService.get<string>(
      'RSS_URL_PREFIX',
      'https://rss.techpostcast.com',
    );
  }

  /**
   * RSS用バケット名
   */
  get RssBucketName(): string {
    return this.configService.get<string>(
      'RSS_BUCKET_NAME',
      'tech-post-cast-rss',
    );
  }

  /**
   * ベースURL
   */
  get LpBaseUrl(): string {
    return this.configService.get<string>(
      'LP_BASE_URL',
      'https://techpostcast.com',
    );
  }

  /**
   * ポッドキャスト画像URL
   */
  get PodcastImageUrl(): string {
    return this.configService.get<string>(
      'PODCAST_IMAGE_URL',
      'https://program-files.techpostcast.com/TechPostCast_Podcast.png',
    );
  }

  /**
   * ポッドキャスト著者名
   */
  get PodcastAuthorName(): string {
    return this.configService.get<string>('PODCAST_AUTHOR_NAME', 'TEP Lab');
  }

  /**
   * ポッドキャスト著者のメールアドレス
   */
  get PodcastAuthorEmail(): string {
    return this.configService.get<string>(
      'PODCAST_AUTHOR_EMAIL',
      'tpc@tep-lab.com',
    );
  }

  /**
   * Cloudflare R2 エンドポイント
   */
  get CloudflareR2Endpoint(): string {
    return this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT', '');
  }

  /**
   * Cloudflare Access Key ID
   */
  get CloudflareAccessKeyId(): string {
    return this.configService.get<string>('CLOUDFLARE_ACCESS_KEY_ID', '');
  }

  /**
   * Cloudflare Secret Access Key
   */
  get CloudflareSecretAccessKey(): string {
    return this.configService.get<string>('CLOUDFLARE_SECRET_ACCESS_KEY', '');
  }
}
