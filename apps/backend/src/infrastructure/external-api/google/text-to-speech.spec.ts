import { AppConfigService } from '@/app-config/app-config.service';
import { TextToSpeechError } from '@/types/errors';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { TermsRepository } from '@infrastructure/database/terms/terms.repository';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { setTimeout } from 'timers/promises';
import { TextToSpeechClient } from './text-to-speech';

const moduleMocker = new ModuleMocker(global);

jest.mock('@google-cloud/text-to-speech');
jest.mock('fs');
jest.mock('timers/promises');

describe('TextToSpeechClient', () => {
  let textToSpeechClient: TextToSpeechClient;
  let appConfigService: AppConfigService;
  let termsRepository: TermsRepository;
  let ttsClientMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextToSpeechClient],
    })
      .useMocker((token) => {
        if (token === AppConfigService) {
          return {};
        } else if (token === TermsRepository) {
          return {};
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();
    ttsClientMock = {
      synthesizeSpeech: jest.fn(),
    };
    textToSpeechClient = module.get<TextToSpeechClient>(TextToSpeechClient);
    textToSpeechClient['ttsClient'] = ttsClientMock;

    appConfigService = module.get<AppConfigService>(AppConfigService);
    termsRepository = module.get<TermsRepository>(TermsRepository);
  });

  it('should be defined', () => {
    expect(textToSpeechClient).toBeDefined();
    expect(appConfigService).toBeDefined();
    expect(termsRepository).toBeDefined();
  });

  describe('synthesizeSpeech', () => {
    test('音声ファイルを正常に生成する', async () => {
      // arrange
      const request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { ssml: '<speak>Hello</speak>' },
        voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const outputFilePath = 'output.mp3';
      const audioContent = 'audioContent';
      ttsClientMock.synthesizeSpeech.mockResolvedValue([{ audioContent }]);
      jest.spyOn(fs, 'writeFileSync').mockImplementation(jest.fn());
      jest.spyOn(global, 'setTimeout').mockImplementation(jest.fn());

      // act
      await textToSpeechClient.synthesizeSpeech(request, outputFilePath);

      // assert
      expect(ttsClientMock.synthesizeSpeech).toHaveBeenCalledWith(request);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        outputFilePath,
        audioContent,
        'binary',
      );
      expect(setTimeout).toHaveBeenCalledWith(1000);
    });

    test('音声コンテンツがない場合にエラーをスローする', async () => {
      // arrange
      const request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { ssml: '<speak>Hello</speak>' },
        voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const outputFilePath = 'output.mp3';
      ttsClientMock.synthesizeSpeech.mockResolvedValue([{}]);

      // act & assert
      await expect(
        textToSpeechClient.synthesizeSpeech(request, outputFilePath),
      ).rejects.toThrow(TextToSpeechError);
    });

    test('エラーが発生した場合に TextToSpeechError をスローする', async () => {
      // arrange
      const request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { ssml: '<speak>Hello</speak>' },
        voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
        audioConfig: { audioEncoding: 'MP3' },
      };
      const outputFilePath = 'output.mp3';
      const error = new Error('error');
      ttsClientMock.synthesizeSpeech.mockRejectedValue(error);

      // act & assert
      await expect(
        textToSpeechClient.synthesizeSpeech(request, outputFilePath),
      ).rejects.toThrow(TextToSpeechError);
    });
  });

  describe('generateTextToSpeechRequest', () => {
    test('Text to speech リクエストを生成する', () => {
      // arrange
      const ssml = '<speak>Hello</speak>';

      // act
      const request = textToSpeechClient.generateTextToSpeechRequest(ssml);

      // assert
      expect(request).toEqual({
        input: { ssml },
        voice: { languageCode: 'ja-JP', name: 'ja-JP-Wavenet-B' },
        audioConfig: {
          audioEncoding: 'MP3',
          effectsProfileId: ['handset-class-device'],
          pitch: -5.0,
          speakingRate: 1.1,
        },
      });
    });
  });

  describe('removeEmoji', () => {
    test('文字列から絵文字を削除する', () => {
      // arrange
      const text = 'Hello 😊';

      // act
      const result = textToSpeechClient.removeEmoji(text);

      // assert
      expect(result).toBe('Hello ');
    });
  });

  describe('formatAudioText', () => {
    test('音声テキストを整形する', async () => {
      // arrange
      const text = 'Hello。 term';
      const term = { term: 'term', reading: 'reading' };
      const terms = [term];
      textToSpeechClient.getTerms = jest.fn().mockResolvedValue(terms);

      // act
      const result = await textToSpeechClient.formatAudioText(text);

      // assert
      const formattedText = `Hello。<break time="200ms"/> <sub alias="${term.reading}">${term.term}</sub> `;
      expect(result).toBe(formattedText);
      expect(textToSpeechClient.getTerms).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTerms', () => {
    test('リポジトリから用語を取得する', async () => {
      // arrange
      const terms = [{ term: 'term', reading: 'reading' }];
      termsRepository.find = jest.fn().mockResolvedValue(terms);

      // act
      const result = await textToSpeechClient.getTerms();

      // assert
      expect(result).toBe(terms);
    });
  });
});
