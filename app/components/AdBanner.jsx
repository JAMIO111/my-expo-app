import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import { useRevenueCat } from '@contexts/RevenueCatProvider';

export default function AdBanner() {
  const { isPro } = useRevenueCat();

  if (isPro) return null;

  const adUnitId = __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: 'your-real-ios-ad-unit-id',
        android: 'your-real-android-ad-unit-id',
      });

  return (
    <BannerAd
      unitId={adUnitId}
      size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
      onAdLoaded={() => console.log('Banner ad loaded')}
      onAdFailedToLoad={(error) => console.error('Banner ad failed to load:', error)}
    />
  );
}
