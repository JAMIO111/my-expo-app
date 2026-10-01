import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRevenueCat } from '@contexts/RevenueCatProvider';

const extra = Constants.expoConfig?.extra || {};

// Only production builds may serve real ads. Development and preview builds always use Google's test
// ad unit, so tapping an ad while testing can never count as invalid traffic on the AdMob account.
const useRealAds = !__DEV__ && extra.APP_ENV === 'production';

export default function AdBanner() {
  const { isPro } = useRevenueCat();

  if (isPro) return null;

  const adUnitId = useRealAds
    ? Platform.select({
        ios: extra.ADMOB_IOS_BANNER_ID,
        android: extra.ADMOB_ANDROID_BANNER_ID,
      })
    : TestIds.BANNER;

  // production build without a configured ad unit: show nothing rather than a broken ad
  if (!adUnitId) return null;

  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
      onAdFailedToLoad={(error) => console.warn('Banner ad failed to load:', error?.message)}
    />
  );
}
