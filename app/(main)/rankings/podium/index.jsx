import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Podium3D from '@components/Podium';
import { Stack, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';

const RANK_CONFIG = [
  { bar: '#FACC15', numBg: 'rgba(250,204,21,0.15)', numColor: '#FACC15', labelColor: '#FACC15' },
  { bar: '#C0C8D8', numBg: 'rgba(192,200,216,0.15)', numColor: '#C0C8D8', labelColor: '#C0C8D8' },
  { bar: '#CD7F32', numBg: 'rgba(205,127,50,0.15)', numColor: '#CD7F32', labelColor: '#CD7F32' },
];

const DEFAULT_RANK = {
  bar: 'rgba(255,255,255,0.08)',
  numBg: 'rgba(255,255,255,0.06)',
  numColor: 'rgba(255,255,255,0.3)',
  labelColor: 'rgba(255,255,255,0.4)',
};

const index = () => {
  const { data, statKey, type, title, label, percent } = useLocalSearchParams();
  const parsedData = JSON.parse(data);
  const sortedData = parsedData.sort((a, b) => b[statKey] - a[statKey]);

  const getValue =
    typeof statKey === 'function' ? statKey : (item) => item[statKey] ?? item.stats?.[statKey] ?? 0;

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand-dark">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader backgroundColor="bg-brand-dark" title={title} />
            </SafeViewWrapper>
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: '#0a0f0a' }}>
        {/* Podium — unchanged */}
        <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 64 }}>
          <Podium3D data={parsedData.slice(0, 3)} statKey={statKey} type={type} label={label} />
        </View>

        {/* Leaderboard sheet */}
        <View style={styles.sheet}>
          {/* Sheet handle */}

          {/* Header row */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{sortedData.length}</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
            {sortedData.map((item, idx) => {
              const rank = RANK_CONFIG[idx] ?? DEFAULT_RANK;
              const statValue = getValue(item);

              return (
                <View key={idx} style={styles.row}>
                  {/* Rank accent bar */}
                  <View style={[styles.rankBar, { backgroundColor: rank.bar }]} />

                  {/* Rank number */}
                  <View style={[styles.rankBadge, { backgroundColor: rank.numBg }]}>
                    <Text style={[styles.rankText, { color: rank.numColor }]}>{idx + 1}</Text>
                  </View>

                  {/* Avatar / Logo */}
                  <View style={styles.avatarWrap}>
                    {type === 'player' ? (
                      <Avatar player={item} size={42} borderRadius={10} />
                    ) : (
                      <TeamLogo
                        thickness={2}
                        color1={item.crest.color1}
                        color2={item.crest.color2}
                        size={42}
                        type={item.crest.type}
                      />
                    )}
                  </View>

                  {/* Name block */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.nameText} numberOfLines={1}>
                      {type === 'player'
                        ? `${item?.first_name} ${item?.surname}`
                        : item?.display_name}
                    </Text>
                    {item?.nickname && (
                      <Text style={[styles.subText, { color: rank.labelColor }]} numberOfLines={1}>
                        {item.nickname.toUpperCase()}
                      </Text>
                    )}
                  </View>

                  {/* Stat */}
                  <View style={styles.statWrap}>
                    <Text style={[styles.statValue, idx < 3 && { color: rank.numColor }]}>
                      {statValue}
                      {percent ? '%' : ''}
                    </Text>
                    {label && <Text style={styles.statLabel}>{label}</Text>}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    marginTop: 12,
    backgroundColor: '#111811',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sheetTitle: {
    fontFamily: 'Saira_600SemiBold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 0.3,
  },
  countPill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countText: {
    fontFamily: 'Saira_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rankBar: {
    width: 3,
    height: 44,
    borderRadius: 2,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontFamily: 'Saira_700Bold',
    fontSize: 14,
  },
  avatarWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  nameText: {
    fontFamily: 'Saira_600SemiBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.1,
  },
  subText: {
    fontFamily: 'Saira_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  statWrap: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  statValue: {
    fontFamily: 'Saira_700Bold',
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: 'Saira_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});

export default index;
