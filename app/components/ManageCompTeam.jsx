import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Keyboard,
  Alert,
} from 'react-native';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomTextInput from '@components/CustomTextInput';
import CustomDropdown from '@components/CustomDropdown';
import useTeamPlayers from '@hooks/useTeamPlayers';
import { useUser } from '@contexts/UserProvider';
import Avatar from '@components/Avatar';
import CTAButton from '@components/CTAButton';

const SHEET_HEIGHT = 520;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Selected player card ─────────────────────────────────────────────────────

function PlayerCard({ player, onRemove, isCaptain, onToggleCaptain }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <View
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isCaptain ? 'rgba(253,204,77,0.25)' : 'rgba(255,255,255,0.07)',
        }}>
        <LinearGradient
          colors={isCaptain ? ['#2a2410', '#1a1a0e'] : ['#1a2a1a', '#111a11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 10,
          }}>
          {/* Avatar */}
          <Avatar player={player} size={40} />

          {/* Name + captain tag */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: 'Saira_600SemiBold', fontSize: 15, color: '#fff' }}
              numberOfLines={1}>
              {player.label}
            </Text>
            {player.subLabel && (
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                }}>
                {player.subLabel}
              </Text>
            )}
          </View>

          {/* Captain toggle */}
          <TouchableOpacity
            onPress={onToggleCaptain}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: isCaptain ? 'rgba(253,204,77,0.15)' : 'rgba(255,255,255,0.06)',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: isCaptain ? 'rgba(253,204,77,0.3)' : 'rgba(255,255,255,0.08)',
            }}>
            <Ionicons
              name="star"
              size={12}
              color={isCaptain ? '#FDCC4D' : 'rgba(255,255,255,0.25)'}
            />
            <Text
              style={{
                fontFamily: 'Saira_500Medium',
                fontSize: 11,
                color: isCaptain ? '#FDCC4D' : 'rgba(255,255,255,0.3)',
              }}>
              {isCaptain ? 'Captain' : 'Set captain'}
            </Text>
          </TouchableOpacity>

          {/* Remove */}
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(248,113,113,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(248,113,113,0.2)',
            }}>
            <Ionicons name="close" size={15} color="#f87171" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

// ─── Picker option row ────────────────────────────────────────────────────────

function PickerRow({ item, isSelected, onPress, index }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      delay: index * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
          borderWidth: 1,
          borderColor: isSelected ? 'rgba(255,255,255,0.12)' : 'transparent',
          marginBottom: 4,
        }}>
        <Avatar player={item} size={38} />

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Saira_500Medium',
              fontSize: 15,
              color: isSelected ? '#fff' : 'rgba(255,255,255,0.75)',
            }}>
            {item.label}
          </Text>
          {item.subLabel && (
            <Text
              style={{
                fontFamily: 'Saira_400Regular',
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
              }}>
              {item.subLabel}
            </Text>
          )}
        </View>

        {/* Check */}
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: isSelected ? '#4ade80' : 'transparent',
            borderWidth: 1.5,
            borderColor: isSelected ? '#4ade80' : 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {isSelected && <Ionicons name="checkmark" size={15} color="#000" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

const ManageCompTeam = ({ type, team }) => {
  const { currentRole } = useUser();
  const { data: teamPlayers } = useTeamPlayers(currentRole?.team?.id);
  const [teamName, setTeamName] = useState(team?.display_name || '');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(team?.players?.map((p) => p.id) || []);
  const [captainId, setCaptainId] = useState(team?.captain || null);

  const playerOptions = useMemo(
    () =>
      teamPlayers?.map((p) => ({
        first_name: p.first_name,
        surname: p.surname,
        nickname: p.nickname,
        id: p.id,
        avatar_url: p.avatar_url,
        label: `${p.first_name} ${p.surname}`,
        value: p.id,
        subLabel: p.nickname ? `(${p.nickname})` : null,
      })) ?? [],
    [teamPlayers]
  );

  const selectedPlayers = playerOptions.filter((p) => selectedPlayerIds.includes(p.value));

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayerIds((prev) => prev.filter((id) => id !== playerId));
    if (captainId === playerId) setCaptainId(null);
  };

  const handleToggleCaptain = (playerId) => {
    setCaptainId((prev) => (prev === playerId ? null : playerId));
  };

  const handleCreateTeam = () => {
    // Validation
    if (!teamName.trim()) {
      Alert.alert('Team name required', 'Please enter a name for your team', [{ text: 'OK' }]);
      return;
    }
    if (selectedPlayerIds.length < 2) {
      Alert.alert('Not enough players', 'At least 2 players are required to form a team', [
        { text: 'OK' },
      ]);
      return;
    }
    if (!captainId) {
      Alert.alert('Captain not set', 'Please assign a captain for the team', [{ text: 'OK' }]);
      return;
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, gap: 20 }}>
      {/* Team name */}
      <CustomTextInput
        title="Team Name"
        titleColor="text-text-1"
        value={teamName}
        onChangeText={setTeamName}
        keyboardType="default"
        placeholder="Enter team name"
        leftIconName="shield-half-outline"
        maxLength={30}
        iconColor="#800080"
        clearButtonMode="never"
      />

      {/* Player picker */}
      <CustomDropdown
        title="Add Players"
        titleColor="text-text-1"
        placeholder="Search players..."
        options={
          teamPlayers?.map((p) => ({
            first_name: p.first_name,
            surname: p.surname,
            nickname: p.nickname,
            id: p.id,
            avatar_url: p.avatar_url,
            label: p.first_name + ' ' + p.surname,
            value: p.id,
            subLabel: p.nickname ? `(${p.nickname})` : null,
          })) || []
        }
        showAvatar={true}
        multiSelect
        leftIconName="people"
        iconColor="#800080"
        values={selectedPlayerIds}
        onChangeMulti={setSelectedPlayerIds}
        onDeselect={(id) => {
          setSelectedPlayerIds((prev) => prev.filter((pid) => pid !== id));
          if (captainId === id) setCaptainId(null);
        }}
      />

      {/* Selected players */}
      {selectedPlayers.length > 0 && (
        <View style={{ gap: 8 }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
            }}>
            <Text
              style={{
                fontFamily: 'Saira_600SemiBold',
                fontSize: 16,
                color: 'rgba(0,0,0,1)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
              Squad · {selectedPlayers.length}
            </Text>
            {!captainId && (
              <Text
                style={{
                  fontFamily: 'Saira_400Regular',
                  fontSize: 12,
                  color: 'rgba(253,150,85,0.8)',
                }}>
                Tap ★ to set a captain
              </Text>
            )}
          </View>

          {selectedPlayers.map((player) => (
            <PlayerCard
              key={player.value}
              player={player}
              isCaptain={captainId === player.value}
              onRemove={() => handleRemovePlayer(player.value)}
              onToggleCaptain={() => handleToggleCaptain(player.value)}
            />
          ))}
        </View>
      )}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} className="p-6">
        <View
          style={{ borderRadius: 30 }}
          className="border border-theme-gray-3 bg-bg-1/80 p-4 shadow-md backdrop-blur-lg">
          <CTAButton
            text={type === 'create' ? 'Create Team' : 'Save Changes'}
            callbackFn={() => {
              type === 'create' ? handleCreateTeam() : null;
            }}
            icon={<Ionicons name="" size={24} color="#000" />}
            type="yellow"
          />
        </View>
      </View>
    </View>
  );
};

export default ManageCompTeam;
