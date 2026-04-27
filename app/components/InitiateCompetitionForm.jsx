import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
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
        <ExpandableView title="Participants" show={showParticipants} setShow={setShowParticipants}>
          <View className="my-4 flex-1 items-center justify-center gap-4 rounded-lg pl-2 pr-6">
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
            {participants.length === 0 ? (
              <Text className="font-saira text-lg text-text-2">No teams in this division.</Text>
            ) : (
              participants.map((participant) => (
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
                    {/* Checkbox */}
                    <Ionicons
                      name={isSelected(participant.id) ? 'checkmark' : ''}
                      size={20}
                      color="white"
                      style={{ opacity: isSelected(participant.id) ? 1 : 0 }}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ExpandableView>
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
            title="Best Of X Frames"
            keyboardType="numeric"
            placeholder="e.g. 20"
            leftIconName="layers-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
        </View>
      </ScrollView>
      <View className="px-5">
        <CTAButton type="yellow" text="Initiate Competition & Seed Teams" callbackFn={() => {}} />
      </View>
    </View>
  );
};

export default InitiateCompetitionForm;
