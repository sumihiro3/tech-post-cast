import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientManager, PrismaService } from '@tech-post-cast/database';

/**
 * テスト用のモジュールを作成する
 * @param metadata モジュールのメタデータ
 * @returns TestingModule
 */
export async function createTestingModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  return Test.createTestingModule(metadata).compile();
}

/**
 * モックPrismaServiceを含むテスト用のモジュールを作成する
 * @param metadata モジュールのメタデータ
 * @returns [TestingModule, MockPrismaService]
 */
export async function createTestingModuleWithMockPrisma(
  metadata: ModuleMetadata,
): Promise<[TestingModule, jest.Mocked<PrismaService>]> {
  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  } as unknown as jest.Mocked<PrismaService>;

  const module = await Test.createTestingModule({
    providers: [
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
      ...(metadata.providers || []),
    ],
    imports: metadata.imports || [],
    controllers: metadata.controllers || [],
    exports: metadata.exports || [],
  }).compile();

  return [module, mockPrismaService];
}

/**
 * モックPrismaClientManagerを含むテスト用のモジュールを作成する
 * @param metadata モジュールのメタデータ
 * @returns [TestingModule, MockPrismaClientManager]
 */
export async function createTestingModuleWithMockPrismaManager(
  metadata: ModuleMetadata,
): Promise<[TestingModule, jest.Mocked<PrismaClientManager>]> {
  const mockClient = {};

  const mockPrismaClientManager = {
    getClient: jest.fn().mockReturnValue(mockClient),
    transaction: jest.fn(),
  } as unknown as jest.Mocked<PrismaClientManager>;

  const module = await Test.createTestingModule({
    providers: [
      {
        provide: PrismaClientManager,
        useValue: mockPrismaClientManager,
      },
      ...(metadata.providers || []),
    ],
    imports: metadata.imports || [],
    controllers: metadata.controllers || [],
    exports: metadata.exports || [],
  }).compile();

  return [module, mockPrismaClientManager];
}
