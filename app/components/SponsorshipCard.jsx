import { View, Text, Pressable, Image, Linking } from 'react-native';
import { ExternalLink, Globe } from 'lucide-react-native';
import { supabase } from '@lib/supabase';
import { useTheme } from '@contexts/ThemeProvider';

export default function SponsorshipCard({
  sponsorInstance,
  competitionName,
  variant = 'featured',
  tagline,
}) {
  const { colors: themeColors } = useTheme();
  if (!sponsorInstance) return null;

  const { name, logo_url, website_url } = sponsorInstance.sponsor;

  const handlePress = async () => {
    if (website_url) {
      Linking.openURL(website_url);
      console.log('Sponsor clicked:', sponsorInstance);
    }

    if (!sponsorInstance?.id) {
      console.error('No sponsor ID found');
      return;
    }

    const { data, error } = await supabase.rpc('increment_sponsor_clicks', {
      p_competition_instance_sponsor_id: sponsorInstance.id,
    });

    console.log('RPC result:', { data, error });

    if (error) {
      console.error('Failed to increment sponsor clicks:', error);
    }
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
        className="w-full flex-row items-center gap-3 rounded-2xl border border-theme-gray-6 bg-bg-grouped-2 px-4 py-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-bg-grouped-2">
          {logoSource ? (
            <Image source={logoSource} style={{ width: 30, height: 30 }} resizeMode="contain" />
          ) : (
            <Globe size={18} color={themeColors.icon} />
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
      className="w-full overflow-hidden rounded-3xl border border-theme-gray-6 bg-bg-grouped-2 p-3">
      <View className="items-center gap-2">
        <View className="w-full flex-row items-center gap-6">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-bg-grouped-3">
            {logoSource ? (
              <Image source={logoSource} style={{ width: 70, height: 70 }} resizeMode="contain" />
            ) : (
              <Globe size={28} color={themeColors.icon} />
            )}
          </View>

          <View className="flex-1 items-start justify-center gap-2 self-stretch">
            <Text className="text-left font-tektur-bold text-2xl text-text-1" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-left font-tektur text-sm text-text-1" numberOfLines={2}>
              {tagline ||
                `Proud sponsor of ${competitionName ? `the ${competitionName}` : 'this competition'}`}
            </Text>
          </View>
        </View>

        {website_url && hostname && (
          <View className="w-full flex-row items-center gap-3 rounded-2xl bg-bg-grouped-3 px-5 py-4">
            <Globe size={18} color={themeColors.secondaryText} />
            <Text className="flex-1 font-tektur-medium text-text-2">{hostname}</Text>
            <ExternalLink size={18} color={themeColors.secondaryText} strokeWidth={2.25} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
