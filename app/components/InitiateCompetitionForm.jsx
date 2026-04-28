import { useState } from 'react';
import { ScrollView, View, Text, Pressable, Switch } from 'react-native';
import CTAButton from './CTAButton';
import ExpandableView from './ExpandableView';
import CustomTextInput from './CustomTextInput';
import TeamLogo from './TeamLogo';
import { Ionicons } from '@expo/vector-icons';

const InitiateCompetitionForm = ({ division, participants, closeModal }) => {
  const [showParticipants, setShowParticipants] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState(participants.map((p) => p.id));
  const [legs, setLegs] = useState(2);
  const [bestOf, setBestOf] = useState(3);
  const [bonusMatch, setBonusMatch] = useState(false);
  const [bonusMatchName, setBonusMatchName] = useState("Captain's Cup");
  const [bonusMatchAbbreviation, setBonusMatchAbbreviation] = useState('CC');

  const isSelected = (id) => selectedParticipants.includes(id);

  const toggleParticipant = (id) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const allSelected =
    participants.length > 0 && selectedParticipants.length === participants.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map((p) => p.id));
    }
  };

  return (
    <View className="flex-1 gap-6 bg-bg-1 pb-16 pt-0">
      <ScrollView contentContainerStyle={{ gap: 6 }} className="flex-1 gap-4 bg-bg-2">
        {/* SETTINGS */}
        <View className="gap-4 bg-bg-1 p-5">
          <CustomTextInput
            value={legs.toString()}
            onChangeText={(text) => setLegs(Number(text))}
            title="Number of Legs"
            keyboardType="numeric"
            placeholder="e.g. 20"
            leftIconName="repeat-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <CustomTextInput
            value={bestOf.toString()}
            onChangeText={(text) => setBestOf(Number(text))}
            title="Best of X Frames"
            keyboardType="numeric"
            placeholder="e.g. 20"
            leftIconName="layers-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 p-3">
            <View className="flex-1 items-start justify-center gap-1">
              <Text className="font-saira-medium text-xl text-text-1">Enable Bonus Frame</Text>
              <Text className="font-saira text-xs text-text-2">
                1 frame per fixture seperate from the league standings e.g. Captain's Cup, Bonus
                Round, etc.
              </Text>
            </View>
            <Switch
              className="w-16"
              value={bonusMatch}
              onValueChange={setBonusMatch}
              trackColor={{ false: '#E5E7EB', true: '#800080' }}
              thumbColor={bonusMatch ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          {bonusMatch && (
            <View className="gap-4">
              <CustomTextInput
                value={bonusMatchName.toString()}
                onChangeText={setBonusMatchName}
                title="Bonus Match Name"
                keyboardType="default"
                placeholder="e.g. Captain's Cup"
                leftIconName="flame-outline"
                iconColor="purple"
                autoCapitalize="words"
                titleColor="text-text-1"
              />
              <CustomTextInput
                value={bonusMatchAbbreviation.toString()}
                onChangeText={setBonusMatchAbbreviation}
                title="Bonus Match Abbreviation"
                keyboardType="default"
                placeholder="e.g. CC"
                leftIconName="pricetag-outline"
                iconColor="purple"
                autoCapitalize="characters"
                titleColor="text-text-1"
                maxLength={3}
              />
            </View>
          )}
        </View>
        <ExpandableView title="Participants" show={showParticipants} setShow={setShowParticipants}>
          <View className="my-4 flex-1 items-center justify-center gap-4 rounded-lg pl-2 pr-3">
            {participants.length === 0 ? (
              <View className="w-full rounded-2xl bg-bg-2 py-8 shadow-sm">
                <Text className="text-center font-saira text-lg text-text-2">
                  No teams in this division.
                </Text>
              </View>
            ) : (
              <View className="w-full flex-1 gap-3 pr-3">
                {/* SELECT ALL */}
                <View className="flex-row items-center gap-3 border-b border-theme-gray-4 pb-4">
                  <Text className="flex-1 font-saira-medium text-xl text-text-1">Select All</Text>
                  <Pressable
                    className={`h-8 w-8 items-center justify-center rounded-lg border ${
                      allSelected ? 'border-brand bg-brand' : 'border-theme-gray-4'
                    }`}
                    onPress={toggleSelectAll}>
                    <Ionicons
                      name={allSelected ? 'checkmark' : ''}
                      size={20}
                      color="white"
                      style={{ opacity: allSelected ? 1 : 0 }}
                    />
                  </Pressable>
                </View>

                {/* PARTICIPANTS */}
                {participants.map((participant) => (
                  <View key={participant.id} className="flex-row items-center gap-3">
                    <TeamLogo {...participant?.crest} size={30} />
                    <Text className="flex-1 font-saira-medium text-lg text-text-1">
                      {participant.display_name}
                    </Text>

                    <Pressable
                      className={`h-8 w-8 items-center justify-center rounded-lg border ${
                        isSelected(participant.id) ? 'border-brand bg-brand' : 'border-theme-gray-4'
                      }`}
                      onPress={() => toggleParticipant(participant.id)}>
                      <Ionicons
                        name={isSelected(participant.id) ? 'checkmark' : ''}
                        size={20}
                        color="white"
                        style={{ opacity: isSelected(participant.id) ? 1 : 0 }}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ExpandableView>
      </ScrollView>

      <View className="px-5">
        <CTAButton type="yellow" text="Initiate Competition & Seed Teams" callbackFn={() => {}} />
      </View>
    </View>
  );
};

export default InitiateCompetitionForm;
