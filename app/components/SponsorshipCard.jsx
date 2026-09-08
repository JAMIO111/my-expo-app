import { View, Text, Pressable, Image, Linking } from 'react-native';
import { ExternalLink, Globe } from 'lucide-react-native';

export default function SponsorshipCard({ sponsor, variant = 'featured', tagline }) {
  if (!sponsor) return null;

  const { name, logo_url, website_url } = sponsor;

  const handlePress = () => {
    if (website_url) Linking.openURL(website_url);
  };

  const logoSource = typeof logo_url === 'string' ? { uri: logo_url } : logo_url;

  const hostname = website_url
    ? website_url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
    : null;

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={!website_url}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
        className="w-full flex-row items-center gap-3 rounded-2xl bg-bg-1 px-4 py-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-bg-grouped-2">
          {logoSource ? (
            <Image source={logoSource} style={{ width: 30, height: 30 }} resizeMode="contain" />
          ) : (
            <Globe size={18} color="rgba(255,255,255,0.35)" />
          )}
        </View>

        <View className="flex-1">
          <Text
            className="font-tektur-semibold text-sm text-text-1"
            numberOfLines={1}
            ellipsizeMode="tail">
            {name}
          </Text>
        </View>

        {website_url && <ExternalLink size={16} color="#d4922a" strokeWidth={2.25} />}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={!website_url}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="w-full overflow-hidden rounded-3xl border border-theme-gray-5 bg-bg-1 p-3">
      <View className="items-center gap-2">
        <View className="w-full flex-row items-center gap-6">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-bg-grouped-2">
            {logoSource ? (
              <Image source={logoSource} style={{ width: 70, height: 70 }} resizeMode="contain" />
            ) : (
              <Globe size={28} color="rgba(255,255,255,0.35)" />
            )}
          </View>

          <View className="flex-1 items-start justify-around self-stretch">
            <Text className="text-left font-tektur-bold text-2xl text-text-1" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-left font-tektur text-sm text-text-1" numberOfLines={2}>
              {tagline || 'Proud sponsor of this competition'}
            </Text>
          </View>
        </View>

        {website_url && hostname && (
          <View className="w-full flex-row items-center gap-3 rounded-2xl bg-bg-2 px-5 py-4">
            <Globe size={18} color="#666" />
            <Text className="flex-1 font-tektur-medium text-text-2">{hostname}</Text>
            <ExternalLink size={18} color="#666" strokeWidth={2.25} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
