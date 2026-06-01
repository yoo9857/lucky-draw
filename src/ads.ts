/**
 * 광고 연동 (앱인토스 광고 SDK).
 *
 * 앱인토스의 loadFullScreenAd/showFullScreenAd 는 내부적으로 토스 광고 또는
 * 구글 애드몹(AdMob)을 자동 중개한다. 즉 AdMob SDK 를 직접 넣지 않고 이 함수만
 * 호출하면 AdMob 수익이 연동된다.
 *
 * - isSupported() 가 false 인 환경(웹 미리보기, 토스 밖)에서는 광고를 띄우지 않고
 *   supported:false 를 반환 → 화면에서 폴백 처리.
 * - 실제 광고가 뜨려면 콘솔에서 발급한 광고 그룹 ID 가 필요하다(아래 상수 교체).
 */

import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// TODO: 앱인토스/애드몹 콘솔에서 발급받은 "보상형 광고 그룹 ID" 로 교체하세요.
export const REWARDED_AD_GROUP_ID = 'REPLACE_WITH_REWARDED_AD_GROUP_ID';

export interface AdResult {
  supported: boolean; // 광고를 띄울 수 있는 환경인가
  rewarded: boolean; // 끝까지 시청해 보상 조건을 충족했는가
}

export function adsSupported(): boolean {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

/**
 * 보상형 전면 광고를 로드 → 표시하고, 시청 보상 여부를 반환한다.
 * 미지원 환경이면 즉시 supported:false 로 resolve.
 */
export function showRewardedAd(adGroupId: string = REWARDED_AD_GROUP_ID): Promise<AdResult> {
  return new Promise((resolve) => {
    if (!adsSupported()) {
      resolve({ supported: false, rewarded: false });
      return;
    }
    let rewarded = false;
    let settled = false;
    const finish = (r: AdResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    try {
      loadFullScreenAd({
        options: { adGroupId },
        onEvent: () => {
          // 로드 완료 → 표시
          showFullScreenAd({
            options: { adGroupId },
            onEvent: (e) => {
              if (e.type === 'userEarnedReward') rewarded = true;
              if (e.type === 'dismissed' || e.type === 'failedToShow') {
                finish({ supported: true, rewarded });
              }
            },
            onError: () => finish({ supported: true, rewarded }),
          });
        },
        onError: () => finish({ supported: false, rewarded: false }),
      });
    } catch {
      finish({ supported: false, rewarded: false });
    }
  });
}
