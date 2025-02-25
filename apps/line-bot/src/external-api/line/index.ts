import { Profile } from '@line/bot-sdk';

/**
 * LIFF access token の有効性を検証する
 * @param token LIFF access token
 * @returns 検証結果
 */
export const verifyLiffAccessToken = async (
  token: string,
): Promise<boolean> => {
  console.debug(`LineService.verifyLiffAccessToken called`, { token });
  let result = false;
  try {
    // LIFF アクセストークンの有効性を検証する
    // @see https://developers.line.biz/ja/reference/line-login/#verify-access-token
    const apiUrl = `https://api.line.me/oauth2/v2.1/verify?access_token=${token}`;
    const response = await fetch(apiUrl, { method: 'GET' });
    if (response.status !== 200) {
      const errorMessage = `LIFF アクセストークンの検証結果が不正でした`;
      const responseData = await response.text();
      console.error(errorMessage, { response: responseData });
      result = false;
    } else {
      console.log(`LIFF アクセストークンの検証に成功しました`);
      result = true;
    }
  } catch (error) {
    const errorMessage = `LIFF アクセストークンの検証結果が不正でした`;
    console.error(errorMessage, { token, error });
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    result = false;
  }
  return result;
};

/**
 * LINE ユーザープロフィールを取得する
 * @param token LIFF access token
 * @returns LineProfile
 */
export const getLineProfile = async (token: string): Promise<Profile> => {
  console.debug(`LineService.getLineProfile called`, { token });
  let profile: Profile;
  try {
    // ユーザープロフィールを取得する
    // @see https://developers.line.biz/ja/reference/line-login/#get-user-profile
    const apiUrl = `https://api.line.me/v2/profile`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'GET',
    });
    if (response.status !== 200) {
      const errorMessage = `LINE ユーザープロフィールの取得に失敗しました`;
      const responseData = await response.text();
      console.error(errorMessage, { response: responseData });
      throw new Error(errorMessage);
    }
    profile = await response.json<Profile>();
    console.log(`LINE ユーザープロフィールを取得しました`, { profile });
    return profile;
  } catch (error) {
    const errorMessage = `LINE ユーザープロフィールの取得に失敗しました`;
    console.error(errorMessage, { token, error });
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    }
    throw new Error(errorMessage);
  }
};
