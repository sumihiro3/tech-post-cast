import { validate } from 'class-validator';
import {
  CreatePersonalizedFeedRequestDto,
  DateRangeFilterDto,
  FilterGroupDto,
  SingleDateRangeFilterConstraint,
} from './create-personalized-feed.request.dto';

describe('PersonalizedFeedsRequestDtoバリデーション', () => {
  describe('SingleDateRangeFilterConstraint', () => {
    let validator: SingleDateRangeFilterConstraint;

    beforeEach(() => {
      validator = new SingleDateRangeFilterConstraint();
    });

    it('dateRangeFiltersが未定義の場合はtrueを返すこと', () => {
      const result = validator.validate(undefined);
      expect(result).toBe(true);
    });

    it('dateRangeFiltersが空配列の場合はtrueを返すこと', () => {
      const result = validator.validate([]);
      expect(result).toBe(true);
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

  describe('FilterGroupDtoバリデーション', () => {
    it('公開日フィルターが1つの場合はバリデーションエラーにならないこと', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }];

      const errors = await validate(filterGroup);
      expect(errors.length).toBe(0);
    });

    it('公開日フィルターが複数ある場合はバリデーションエラーになること', async () => {
      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }, { daysAgo: 60 }];

      const errors = await validate(filterGroup);
      expect(errors.length).toBeGreaterThan(0);

      // バリデーションエラーのメッセージが正しいか確認
      const dateRangeFiltersError = errors.find(
        (error) => error.property === 'dateRangeFilters',
      );
      expect(dateRangeFiltersError).toBeDefined();
      expect(dateRangeFiltersError?.constraints?.singleDateRangeFilter).toBe(
        '公開日フィルターは1つだけ設定できます',
      );
    });
  });

  describe('CreatePersonalizedFeedRequestDtoバリデーション', () => {
    it('公開日フィルターが1つの場合はバリデーションエラーにならないこと', async () => {
      const dto = new CreatePersonalizedFeedRequestDto();
      dto.name = 'テストフィード';
      dto.dataSource = 'qiita';
      dto.filterConfig = {};
      dto.deliveryConfig = {};

      const filterGroup = new FilterGroupDto();
      filterGroup.name = 'テストグループ';
      filterGroup.logicType = 'OR';
      filterGroup.dateRangeFilters = [{ daysAgo: 30 }];

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

      const filterGroup2 = new FilterGroupDto();
      filterGroup2.name = 'グループ2';
      filterGroup2.logicType = 'AND';
      filterGroup2.dateRangeFilters = [{ daysAgo: 60 }, { daysAgo: 90 }];

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
  });
});
