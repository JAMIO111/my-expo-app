import { useRef } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import Svg, { Rect, Line, Pattern, Defs } from 'react-native-svg';
import { Coins, Gauge, Shield, Cake, ChevronRight, VenusAndMars, Users } from 'lucide-react-native';
import { formatAgeRestrictions } from '@components/CompetitionInstanceCard';

/**
 * ── Blueprint palette ──
 * Classic drafting-paper blue, cyan linework, near-white "ink" for text.
 */
const INK = '#EAF3FA'; // high-emphasis text ("white ink")
const INK_DIM = 'rgba(234,243,250,0.55)'; // secondary text
const PAPER_BG = '#0B3D63'; // base blueprint blue
const PAPER_BG_DARK = '#082D4A'; // header/footer band
const LINE_SOFT = 'rgba(255,255,255,0.12)'; // fine grid
const LINE_STRONG = 'rgba(255,255,255,0.3)'; // major grid / crop marks
const CYAN = '#7FDBFF'; // accent / labels
const AMBER = '#FBBF24'; // "awaiting initiation" stamp
const GREEN = '#4ADE80'; // "initiated" stamp

/**
 * NOTE ON FIELDS
 * ---------------
 * This mirrors the fields on the original CompetitionCard (name, competitor_type,
 * competition_type, gender, min_age, max_age) and adds a few commonly-needed
 * eligibility fields as OPTIONAL, so nothing breaks if your `competition` object
 * doesn't have them yet — rename/remove to match your actual schema:
 *   - competition.division / competition.skill_level
 *   - competition.min_handicap / competition.max_handicap
 *   - competition.team_size / competition.min_team_size / competition.max_team_size
 *   - competition.entry_fee
 */

const CompetitionBlueprint = ({ competition, numberOfInstances, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  const hasInstances = numberOfInstances > 0;

  const typeLabel =
    competition.competitor_type.charAt(0).toUpperCase() +
    competition.competitor_type.slice(1) +
    ' · ' +
    competition.competition_type.charAt(0).toUpperCase() +
    competition.competition_type.slice(1) +
    ' Format';

  const genderLabel =
    competition.gender === 'male'
      ? 'Male only'
      : competition.gender === 'female'
        ? 'Female only'
        : 'Open (Male & Female)';

  const ageLabel =
    competition.min_age || competition.max_age
      ? formatAgeRestrictions(competition.min_age, competition.max_age)
      : 'No age restriction';

  const divisionLabel = competition?.division?.name || null;

  const teamSizeLabel = competition.team_size
    ? `${competition.team_size} players`
    : competition.min_team_size && competition.max_team_size
      ? `${competition.min_team_size}–${competition.max_team_size} players`
      : competition.min_team_size
        ? `Min ${competition.min_team_size} players`
        : competition.max_team_size
          ? `Max ${competition.max_team_size} players`
          : null;

  const drawingNo = `CMP-${String(competition.id ?? '000')
    .toString()
    .slice(-4)
    .padStart(4, '0')}`;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: PAPER_BG,
          borderWidth: 1,
          borderColor: LINE_STRONG,
        }}>
        {/* ── Grid background ── */}
        <Svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}>
          <Defs>
            <Pattern id="bpGridMinor" width={16} height={16} patternUnits="userSpaceOnUse">
              <Line x1={0} y1={0} x2={0} y2={16} stroke={LINE_SOFT} strokeWidth={1} />
              <Line x1={0} y1={0} x2={16} y2={0} stroke={LINE_SOFT} strokeWidth={1} />
            </Pattern>
            <Pattern id="bpGridMajor" width={80} height={80} patternUnits="userSpaceOnUse">
              <Line x1={0} y1={0} x2={0} y2={80} stroke={LINE_STRONG} strokeWidth={1} />
              <Line x1={0} y1={0} x2={80} y2={0} stroke={LINE_STRONG} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#bpGridMinor)" />
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#bpGridMajor)" opacity={0.5} />
        </Svg>

        {/* ── Corner crop marks ── */}
        <CornerMark position="tl" />
        <CornerMark position="tr" />
        <CornerMark position="bl" />
        <CornerMark position="br" />

        {/* ── Header band ── */}
        <View
          style={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: 'rgba(8,45,74,0.55)',
            borderBottomWidth: 1,
            borderBottomColor: LINE_STRONG,
            borderStyle: 'dashed',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
            }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: 'Saira_600SemiBold',
                  fontSize: 10,
                  letterSpacing: 2,
                  color: CYAN,
                  marginBottom: 6,
                }}>
                COMPETITION BLUEPRINT · {drawingNo}
              </Text>
              <Text
                style={{
                  fontFamily: 'Saira_700Bold',
                  fontSize: 21,
                  letterSpacing: 0.5,
                  color: INK,
                  textTransform: 'uppercase',
                }}
                numberOfLines={2}>
                {competition.name}
              </Text>
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 12,
                  color: INK_DIM,
                  letterSpacing: 0.3,
                  marginTop: 3,
                }}>
                {typeLabel}
              </Text>
            </View>

            <StatusStamp hasInstances={hasInstances} numberOfInstances={numberOfInstances} />
          </View>

          {/* ruler strip */}
          <RulerStrip />
        </View>

        {/* ── Spec sheet ── */}
        <View style={{ paddingHorizontal: 18, paddingVertical: 10 }}>
          <SpecRow
            icon={<VenusAndMars size={13} color={CYAN} />}
            label="Gender"
            value={genderLabel}
          />
          <SpecRow
            icon={<Cake name="cake-variant-outline" size={13} color={CYAN} />}
            label="Age range"
            value={ageLabel}
          />
          <SpecRow
            icon={<Shield name="shield-star-outline" size={13} color={CYAN} />}
            label="Division"
            value={divisionLabel}
          />
          <SpecRow
            icon={<Users size={13} color={CYAN} />}
            label="Team size"
            value={teamSizeLabel}
          />
        </View>

        {/* ── Title block footer (like a real drawing title block) ── */}
        <View
          style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: LINE_STRONG,
            backgroundColor: PAPER_BG_DARK,
          }}>
          <TitleBlockCell label="SCALE" value="1:1" />
          <TitleBlockCell label="REV" value={String(numberOfInstances ?? 0).padStart(2, '0')} />
          <TitleBlockCell
            label="STATUS"
            value={hasInstances ? 'INITIATED' : 'PENDING'}
            valueColor={hasInstances ? GREEN : AMBER}
            last
          />
          <View
            style={{
              flex: 1.4,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingHorizontal: 12,
              gap: 4,
            }}>
            <Text
              style={{
                fontFamily: 'Saira_400Regular',
                fontSize: 11,
                color: INK_DIM,
              }}>
              {hasInstances ? 'View instances' : 'Tap to initiate'}
            </Text>
            <ChevronRight size={13} color={INK_DIM} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

/** One "L" shaped crop mark in a given corner, like a print/drafting registration mark. */
const CornerMark = ({ position }) => {
  const size = 14;
  const base = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: CYAN,
  };
  const byPosition = {
    tl: { ...base, top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { ...base, top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { ...base, bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { ...base, bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  };
  return <View style={byPosition[position]} pointerEvents="none" />;
};

/** Thin ruler/tick strip under the header, purely decorative. */
const RulerStrip = () => (
  <Svg height={8} width="100%" style={{ marginTop: 10 }}>
    <Line x1="0" y1="1" x2="100%" y2="1" stroke={LINE_STRONG} strokeWidth={1} />
    {Array.from({ length: 24 }).map((_, i) => (
      <Line
        key={i}
        x1={`${(i / 23) * 100}%`}
        y1="1"
        x2={`${(i / 23) * 100}%`}
        y2={i % 4 === 0 ? '8' : '5'}
        stroke={LINE_STRONG}
        strokeWidth={1}
      />
    ))}
  </Svg>
);

/** A labelled row with a dashed "dimension line" leader, like a spec callout. */
const SpecRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: 108 }}>
        {icon}
        <Text
          style={{
            fontFamily: 'Saira_600SemiBold',
            fontSize: 10.5,
            letterSpacing: 1,
            color: CYAN,
            textTransform: 'uppercase',
          }}>
          {label}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          borderBottomWidth: 1,
          borderStyle: 'dashed',
          borderColor: LINE_STRONG,
          marginHorizontal: 8,
          marginBottom: 3,
        }}
      />
      <Text
        style={{ fontFamily: 'Saira_500Medium', fontSize: 13, color: INK, maxWidth: '38%' }}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

/** Rubber-stamp style status badge, rotated slightly, double dashed border. */
const StatusStamp = ({ hasInstances, numberOfInstances }) => {
  const color = hasInstances ? GREEN : AMBER;
  const label = hasInstances
    ? `${numberOfInstances} INSTANCE${numberOfInstances > 1 ? 'S' : ''}`
    : 'NOT YET BUILT';
  return (
    <View
      style={{
        transform: [{ rotate: '-6deg' }],
        borderWidth: 1.5,
        borderColor: color,
        borderStyle: 'dashed',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginTop: 2,
      }}>
      <Text
        style={{
          fontFamily: 'Saira_700Bold',
          fontSize: 10,
          letterSpacing: 1,
          color,
        }}>
        {label}
      </Text>
    </View>
  );
};

/** One cell of the footer "title block" (SCALE / REV / STATUS), like on a real drawing. */
const TitleBlockCell = ({ label, value, valueColor = INK, last = false }) => (
  <View
    style={{
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRightWidth: last ? 1 : 1,
      borderRightColor: LINE_SOFT,
    }}>
    <Text
      style={{
        fontFamily: 'Saira_600SemiBold',
        fontSize: 9,
        letterSpacing: 1,
        color: INK_DIM,
      }}>
      {label}
    </Text>
    <Text
      style={{
        fontFamily: 'Saira_700Bold',
        fontSize: 12,
        color: valueColor,
        marginTop: 1,
      }}>
      {value}
    </Text>
  </View>
);

export default CompetitionBlueprint;
