import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@tech-post-cast/database';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

/**
 * テスト用のモジュールを作成するヘルパー関数
 * @param metadata モジュールのメタデータ
 * @returns TestingModule
 */
export async function createTestingModule(metadata: ModuleMetadata): Promise<TestingModule> {
  return Test.createTestingModule(metadata).compile();
}

/**
 * PrismaServiceをモック化したテスト用のモジュールを作成するヘルパー関数
 * @param metadata モジュールのメタデータ
 * @returns [TestingModule, DeepMockProxy<PrismaService>]
 */
export async function createTestingModuleWithMockPrisma(
  metadata: ModuleMetadata,
): Promise<[TestingModule, DeepMockProxy<PrismaService>]> {
  const mockPrismaService = mockDeep<PrismaService>();

  const updatedMetadata: ModuleMetadata = {
    ...metadata,
    providers: [
      ...(metadata.providers || []),
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
  };

  const module = await Test.createTestingModule(updatedMetadata).compile();

  return [module, mockPrismaService];
}
