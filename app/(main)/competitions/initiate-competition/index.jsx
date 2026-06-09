import { View, Text, Pressable, Animated } from 'react-native';
import { useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useCompetitions } from '@hooks/useCompetitions';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatAgeRestrictions } from '@components/CompetitionInstanceCard';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import Toast from 'react-native-toast-message';

// ─── Reusable chip (mirrors StatusBadge) ─────────────────────────────────────

const Chip = ({ icon, label, colors }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors?.background ?? 'rgba(255,255,255,0.06)',
      borderColor: colors?.border ?? 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    }}>
    {icon}
    <Text
      style={{
        fontFamily: 'Saira_500Medium',
        fontSize: 12,
        color: colors?.text ?? 'rgba(255,255,255,0.5)',
      }}>
      {label}
    </Text>
  </View>
);

// ─── Competition card ─────────────────────────────────────────────────────────

const CompetitionCard = ({ competition, numberOfInstances, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const hasInstances = numberOfInstances > 0;
  const accentColor = hasInstances ? '#4ade80' : '#f87171';
  const instanceColors = hasInstances
    ? { background: '#00800033', text: '#4ade80', border: '#4ade8044' }
    : { background: '#FF000022', text: '#f87171', border: '#f8717144' };

  const typeLabel =
    competition.competitor_type.charAt(0).toUpperCase() +
    competition.competitor_type.slice(1) +
    ' · ' +
    competition.competition_type.charAt(0).toUpperCase() +
    competition.competition_type.slice(1) +
    ' Format';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.07)',
        }}>
        {/* ── Accent bar ── */}
        <View style={{ height: 8, backgroundColor: accentColor, width: '100%' }} />

        {/* ── Header ── */}
        <LinearGradient
          colors={['#1a2a1a', '#111a11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 }}>
          {/* Name row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
            }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Saira_700Bold',
                  fontSize: 20,
                  color: '#fff',
                  marginBottom: 3,
                }}
                numberOfLines={2}>
                {competition.name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 0.3,
                }}>
                {typeLabel}
              </Text>
            </View>

            {/* Instance count badge */}
            <Chip
              label={
                hasInstances
                  ? `${numberOfInstances} Instance${numberOfInstances > 1 ? 's' : ''}`
                  : 'No Instances'
              }
              colors={instanceColors}
            />
          </View>

          {/* Gender + age chips */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {competition.gender !== 'female' && (
              <Chip
                icon={<Ionicons name="male" size={13} color="#60a5fa" />}
                label="Male"
                colors={undefined}
              />
            )}
            {competition.gender !== 'male' && (
              <Chip
                icon={<Ionicons name="female" size={13} color="#f9a8d4" />}
                label="Female"
                colors={undefined}
              />
            )}
            {(competition.min_age || competition.max_age) && (
              <Chip
                icon={
                  <MaterialCommunityIcons
                    name="cake-variant-outline"
                    size={13}
                    color="rgba(255,255,255,0.45)"
                  />
                }
                label={formatAgeRestrictions(competition.min_age, competition.max_age)}
                colors={undefined}
              />
            )}
          </View>
        </LinearGradient>

        {/* ── Footer ── */}
        <LinearGradient
          colors={['#0f160f', '#0c130c']}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.05)',
          }}>
          {!hasInstances && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.35)',
                }}>
                Tap to initiate
              </Text>
              <Ionicons name="chevron-forward-outline" size={14} color="rgba(255,255,255,0.35)" />
            </View>
          )}
          {hasInstances && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="rgba(255,255,255,0.35)"
              />
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.35)',
                }}>
                Already initiated
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const index = () => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const {
    data: competitions = [],
    isLoading,
    isError,
  } = useCompetitions({
    districtId: currentRole?.district?.id,
  });
  const { data: competitionsInstances } = useCompetitionInstances(currentRole?.activeSeason?.id);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title="Initiate Competition" />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <View className="mt-16 flex-1 bg-bg-1">
          <Text className="p-2 px-6 pt-3 font-saira-medium text-xl text-text-1">
            Select a competition from your blueprints that you'd like to initiate for the{' '}
            {currentRole?.activeSeason.name} season.
          </Text>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              gap: 12,
              paddingTop: 10,
              paddingBottom: 60,
              paddingHorizontal: 16,
            }}
            className="flex-1 bg-bg-2">
            {competitions
              .sort((a, b) => {
                const aCount =
                  competitionsInstances?.filter((i) => i.competition_id === a.id).length ?? 0;
                const bCount =
                  competitionsInstances?.filter((i) => i.competition_id === b.id).length ?? 0;
                return aCount - bCount;
              })
              .map((competition) => {
                const numberOfInstances =
                  competitionsInstances?.filter((i) => i.competition_id === competition.id)
                    .length ?? 0;
                return (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    numberOfInstances={numberOfInstances}
                    onPress={() => {
                      if (hasNavigated.current) return;
                      hasNavigated.current = true;
                      setTimeout(() => {
                        hasNavigated.current = false;
                      }, 500);
                      if (numberOfInstances > 0) {
                        Toast.show({
                          type: 'info',
                          text1: 'Competition Already Initiated',
                          text2: `There ${numberOfInstances === 1 ? 'is' : 'are'} already ${numberOfInstances} instance${numberOfInstances === 1 ? '' : 's'} of this competition. You can manage existing instances from the main competitions screen.`,
                        });
                        return;
                      }
                      router.push(
                        `/competitions/initiate-competition/modify-competition-rules?competitionId=${competition.id}`
                      );
                    }}
                  />
                );
              })}
          </ScrollView>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default index;
