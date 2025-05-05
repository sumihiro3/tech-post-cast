import { validate } from 'class-validator';
import {
  CreatePersonalizedFeedRequestDto,
  DateRangeFilterDto,
  FilterGroupDto,
  LikesCountFilterDto,
  SingleDateRangeFilterConstraint,
  SingleLikesCountFilterConstraint,
} from './create-personalized-feed.request.dto';

describe('PersonalizedFeedsRequestDtoバリデーション', () => {
  describe('DateRangeFilterDtoバリデーション', () => {
    it('daysAgoが正の値の場合はバリデーションエラーにならないこと', async () => {
      const dto = new DateRangeFilterDto();
      dto.daysAgo = 30;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('daysAgoが負の値の場合はバリデーションエラーになること', async () => {
      const dto = new DateRangeFilterDto();
      dto.daysAgo = -10;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // バリデーションエラーのメッセージが正しいか確認
      const daysAgoError = errors.find((error) => error.property === 'daysAgo');
      expect(daysAgoError).toBeDefined();
      expect(daysAgoError?.constraints?.min).toBe(
        '日数は1以上である必要があります',
      );
    });

    it('daysAgoが0の場合はバリデーションエラーになること', async () => {
      const dto = new DateRangeFilterDto();
      dto.daysAgo = 0;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // バリデーションエラーのメッセージが正しいか確認
      const daysAgoError = errors.find((error) => error.property === 'daysAgo');
      expect(daysAgoError).toBeDefined();
      expect(daysAgoError?.constraints?.min).toBe(
        '日数は1以上である必要があります',
      );
    });
  });

  describe('SingleDateRangeFilterConstraint', () => {
    let validator: SingleDateRangeFilterConstraint;

    beforeEach(() => {
      validator = new SingleDateRangeFilterConstraint();
    });

    it('dateRangeFiltersが未定義の場合はfalseを返すこと', () => {
      const result = validator.validate(undefined);
      expect(result).toBe(false);
    });

    it('dateRangeFiltersが空配列の場合はfalseを返すこと', () => {
      const result = validator.validate([]);
      expect(result).toBe(false);
    });

    it('dateRangeFiltersが1つの要素を持つ配列の場合はtrueを返すこと', () => {
      const dateRangeFilters: DateRangeFilterDto[] = [{ daysAgo: 30 }];
      const result = validator.validate(dateRangeFilters);
      expect(result).toBe(true);
    });

    it('dateRangeFiltersが複数の要素を持つ配列の場合はfalseを返すこと', () => {
      const dateRangeFilters: DateRangeFilterDto[] = [
        { daysAgo: 30 },
        { daysAgo: 60 },
      ];
      const result = validator.validate(dateRangeFilters);
      expect(result).toBe(false);
    });
  });

  describe('SingleLikesCountFilterConstraint', () => {
    let validator: SingleLikesCountFilterConstraint;

    beforeEach(() => {
      validator = new SingleLikesCountFilterConstraint();
    });

    it('likesCountFiltersが未定義の場合はfalseを返すこと', () => {
      const result = validator.validate(undefined);
      expect(result).toBe(false);
    });

    it('likesCountFiltersが空配列の場合はfalseを返すこと', () => {
      const result = validator.validate([]);
      expect(result).toBe(false);
    });

    it('likesCountFiltersが1つの要素を持つ配列の場合はtrueを返すこと', () => {
      const likesCountFilters: LikesCountFilterDto[] = [{ minLikes: 10 }];
      const result = validator.validate(likesCountFilters);
      expect(result).toBe(true);
    });

    it('likesCountFiltersが複数の要素を持つ配列の場合はfalseを返すこと', () => {
      const likesCountFilters: LikesCountFilterDto[] = [
        { minLikes: 10 },
        { minLikes: 20 },
      ];
      const result = validator.validate(likesCountFilters);
      expect(result).toBe(false);
    });
  });

  describe('FilterGroupDtoバリデーション', () => {
    it('公開日フィルターといいね数フィルターが各1つの場合はバリデーションエラーにならないこと', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }];
      filterGroup.likesCountFilters = [{ minLikes: 10 }];

      const errors = await validate(filterGroup);
      expect(errors.length).toBe(0);
    });

    it('公開日フィルターが複数ある場合はバリデーションエラーになること', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }, { daysAgo: 60 }];
      filterGroup.likesCountFilters = [{ minLikes: 10 }];

      const errors = await validate(filterGroup);
      expect(errors.length).toBeGreaterThan(0);

      // バリデーションエラーのメッセージが正しいか確認
      const dateRangeFiltersError = errors.find(
        (error) => error.property === 'dateRangeFilters',
      );
      expect(dateRangeFiltersError).toBeDefined();
      expect(dateRangeFiltersError?.constraints?.singleDateRangeFilter).toBe(
        '公開日フィルターは1つだけ設定する必要があります',
      );
    });

    it('いいね数フィルターが複数ある場合はバリデーションエラーになること', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }];
      filterGroup.likesCountFilters = [{ minLikes: 10 }, { minLikes: 20 }];

      const errors = await validate(filterGroup);
      expect(errors.length).toBeGreaterThan(0);

      // バリデーションエラーのメッセージが正しいか確認
      const likesCountFiltersError = errors.find(
        (error) => error.property === 'likesCountFilters',
      );
      expect(likesCountFiltersError).toBeDefined();
      expect(likesCountFiltersError?.constraints?.singleLikesCountFilter).toBe(
        'いいね数フィルターは1つだけ設定する必要があります',
      );
    });

    it('公開日フィルターが未設定の場合はバリデーションエラーになること', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.likesCountFilters = [{ minLikes: 10 }];
      // dateRangeFiltersは未設定

      const errors = await validate(filterGroup);
      expect(errors.length).toBeGreaterThan(0);

      // 必須項目のエラーが含まれていることを確認
      const hasRequiredError = errors.some(
        (error) =>
          error.property === 'dateRangeFilters' &&
          Object.values(error.constraints || {}).some((msg) =>
            msg.includes('必要があります'),
          ),
      );
      expect(hasRequiredError).toBe(true);
    });

    it('いいね数フィルターが未設定の場合はバリデーションエラーになること', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }];
      // likesCountFiltersは未設定

      const errors = await validate(filterGroup);
      expect(errors.length).toBeGreaterThan(0);

      // 必須項目のエラーが含まれていることを確認
      const hasRequiredError = errors.some(
        (error) =>
          error.property === 'likesCountFilters' &&
          Object.values(error.constraints || {}).some((msg) =>
            msg.includes('必要があります'),
          ),
      );
      expect(hasRequiredError).toBe(true);
    });
  });

  describe('CreatePersonalizedFeedRequestDtoバリデーション', () => {
    it('公開日フィルターといいね数フィルターが各1つの場合はバリデーションエラーにならないこと', async () => {
      const dto = new CreatePersonalizedFeedRequestDto();
      dto.name = 'テストフィード';
      dto.dataSource = 'qiita';
      dto.filterConfig = {};
      dto.deliveryConfig = {};

      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }];
      filterGroup.likesCountFilters = [{ minLikes: 10 }];

      dto.filterGroups = [filterGroup];

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('複数のフィルターグループがあり、一部に複数の公開日フィルターがある場合はバリデーションエラーになること', async () => {
      const dto = new CreatePersonalizedFeedRequestDto();
      dto.name = 'テストフィード';
      dto.dataSource = 'qiita';
      dto.filterConfig = {};
      dto.deliveryConfig = {};

      const filterGroup1 = new FilterGroupDto();
      filterGroup1.name = 'グループ1';
      filterGroup1.logicType = 'OR';
      filterGroup1.dateRangeFilters = [{ daysAgo: 30 }];
      filterGroup1.likesCountFilters = [{ minLikes: 10 }];

      const filterGroup2 = new FilterGroupDto();
      filterGroup2.name = 'グループ2';
      filterGroup2.logicType = 'AND';
      filterGroup2.dateRangeFilters = [{ daysAgo: 60 }, { daysAgo: 90 }];
      filterGroup2.likesCountFilters = [{ minLikes: 20 }];

      dto.filterGroups = [filterGroup1, filterGroup2];

      const errors = await validate(dto, {
        validationError: { target: false },
      });

      // filterGroupsのバリデーションエラーを確認
      const filterGroupsErrors = errors.find(
        (error) => error.property === 'filterGroups',
      );
      expect(filterGroupsErrors).toBeDefined();

      // ネストされたバリデーションエラーを持つこと
      expect(filterGroupsErrors?.children).toBeDefined();
      expect(filterGroupsErrors?.children.length).toBeGreaterThan(0);

      // 2つ目のフィルターグループにエラーがあること
      const group2Errors = filterGroupsErrors?.children[1];
      expect(group2Errors).toBeDefined();

      // dateRangeFiltersプロパティにエラーがあること
      const dateRangeFiltersError = group2Errors?.children.find(
        (error) => error.property === 'dateRangeFilters',
      );
      expect(dateRangeFiltersError).toBeDefined();
    });

    it('複数のフィルターグループがあり、一部に複数のいいね数フィルターがある場合はバリデーションエラーになること', async () => {
      const dto = new CreatePersonalizedFeedRequestDto();
      dto.name = 'テストフィード';
      dto.dataSource = 'qiita';
      dto.filterConfig = {};
      dto.deliveryConfig = {};

      const filterGroup1 = new FilterGroupDto();
      filterGroup1.name = 'グループ1';
      filterGroup1.logicType = 'OR';
      filterGroup1.dateRangeFilters = [{ daysAgo: 30 }];
      filterGroup1.likesCountFilters = [{ minLikes: 10 }];

      const filterGroup2 = new FilterGroupDto();
      filterGroup2.name = 'グループ2';
      filterGroup2.logicType = 'AND';
      filterGroup2.dateRangeFilters = [{ daysAgo: 60 }];
      filterGroup2.likesCountFilters = [{ minLikes: 20 }, { minLikes: 30 }];

      dto.filterGroups = [filterGroup1, filterGroup2];

      const errors = await validate(dto, {
        validationError: { target: false },
      });

      // filterGroupsのバリデーションエラーを確認
      const filterGroupsErrors = errors.find(
        (error) => error.property === 'filterGroups',
      );
      expect(filterGroupsErrors).toBeDefined();

      // ネストされたバリデーションエラーを持つこと
      expect(filterGroupsErrors?.children).toBeDefined();
      expect(filterGroupsErrors?.children.length).toBeGreaterThan(0);

      // 2つ目のフィルターグループにエラーがあること
      const group2Errors = filterGroupsErrors?.children[1];
      expect(group2Errors).toBeDefined();

      // likesCountFiltersプロパティにエラーがあること
      const likesCountFiltersError = group2Errors?.children.find(
        (error) => error.property === 'likesCountFilters',
      );
      expect(likesCountFiltersError).toBeDefined();
    });
  });
});
