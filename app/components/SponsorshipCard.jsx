import { View, Text, Pressable, Image, Linking } from 'react-native';
import { ExternalLink, Globe } from 'lucide-react-native';

/**
 * SponsorshipCard
 * Displays a sponsor's logo, company name, and optional tagline/tier,
 * with a tap-through to their website. Designed for league/competition
 * detail pages — supports both a full-width "featured" card and a
 * compact variant for listing several sponsors together.
 *
 * Props:
 * - sponsor: {
 *     name: string,
 *     logo: string (image URL) | ImageSourcePropType,
 *     website?: string,
 *     tagline?: string,
 *     tier?: string        e.g. "Title Sponsor", "Official Partner"
 *   }
 * - variant: 'featured' | 'compact' — default 'featured'
 */
export default function SponsorshipCard({ sponsor, variant = 'featured' }) {
  if (!sponsor) return null;

  const { name, logo, website, tagline, tier } = sponsor;

  const handlePress = () => {
    if (website) Linking.openURL(website);
  };

  const logoSource = typeof logo === 'string' ? { uri: logo } : logo;

  const hostname = website
    ? website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
    : null;

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={!website}
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
          {tier && (
            <Text className="mt-0.5 font-tektur text-xs text-text-2" numberOfLines={1}>
              {tier}
            </Text>
          )}
        </View>

        {website && <ExternalLink size={16} color="#d4922a" strokeWidth={2.25} />}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={!website}
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

          <View className="flex-1 items-start justify-between self-stretch">
            <Text className="text-left font-tektur-bold text-2xl text-text-1" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-left font-tektur text-sm text-text-1" numberOfLines={2}>
              Proud sponsor of the Northumberland Pool League
            </Text>
          </View>
        </View>

        {website && hostname && (
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

/**
 * Example usage:
 *
 * <SponsorshipCard
 *   sponsor={{
 *     name: "Shankhouse Sports Club",
 *     logo: "https://example.com/logo.png",
 *     website: "https://shankhouseclub.co.uk",
 *     tagline: "Proud sponsor of the Northumberland Pool League",
 *     tier: "Title Sponsor",
 *   }}
 * />
 *
 * // Compact list of sponsors on a competition page:
 * {sponsors.map((s) => (
 *   <SponsorshipCard key={s.id} sponsor={s} variant="compact" />
 * ))}
 */
