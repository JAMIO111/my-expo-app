import { StyleSheet, View, Text } from 'react-native';
import { useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import DivisionAccordion from '@components/DivisionAccordion';
import { useTeamsByDivision } from '@hooks/useTeamsByDivision';
import FixturesAccordion from '@components/FixturesAccordion';
import Heading from '@components/Heading';
import ExpandableView from '@components/ExpandableView';
import BottomSheetModal from '@components/BottomSheetModal';

const DivisionOverview = () => {
  const { currentRole } = useUser();
  const params = useLocalSearchParams();
  const division = params.divisionStr ? JSON.parse(params.divisionStr) : {};
  const { data: teams, isLoading, isError } = useTeamsByDivision(division.id);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [competitionInstance, setCompetitionInstance] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  console.log('Division Overview for:', division);
  console.log('Teams in Division:', teams);
  console.log('Error loading teams:', isError);
  console.log('Competition Instance:', competitionInstance);

  const currentSeasonComp = currentRole?.competitions?.find(
    (comp) =>
      comp.season_id === currentRole.activeSeason?.id &&
      comp.division_id === division.id &&
      comp.competition_type === 'league'
  );

  console.log('Current Season Competition:', currentSeasonComp);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                onRightPress={() => {
                  setShowModal(true);
                }}
                rightIcon="build"
                showBack={true}
                title={division.name || 'My Division'}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{ gap: 5, marginVertical: 58, paddingBottom: 32 }}
          className="flex-1 bg-bg-2">
          <View className="bg-bg-1 p-3">
            <ExpandableView title="Division Details" show={showDetails} setShow={setShowDetails}>
              <View className="flex-row pt-2">
                <View className="flex-1 gap-3">
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Division Name</Text>
                    <Text className="px-1 font-saira-medium text-xl text-text-1">
                      {division.name}
                    </Text>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Tier</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="px-1 font-saira-medium text-xl text-text-1">
                        {division.tier || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Promotion Spots</Text>
                    <Text className="px-1 font-saira-medium text-xl text-text-1">
                      {division.promotions || 'No promotions'}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 gap-3">
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Division Group</Text>
                    <Text className="px-1 font-saira-medium text-xl text-text-1">
                      {division.group_name || 'N/A'}
                    </Text>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Competitor Type</Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="px-1 font-saira-medium text-xl text-text-1">
                        {division.competitor_type
                          ? division.competitor_type.slice(0, 1).toUpperCase() +
                            division.competitor_type.slice(1)
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View>
                    <Text className="px-1 font-saira text-lg text-text-2">Relegation Spots</Text>
                    <Text className="px-1 font-saira-medium text-xl text-text-1">
                      {division.relegation_spots || 'No relegations'}
                    </Text>
                  </View>
                </View>
              </View>
            </ExpandableView>
          </View>
          <View className="gap-3 bg-bg-1 p-3 py-6">
            <View className="">
              <Heading text="Team Management" />
            </View>
            <DivisionAccordion
              isExpanded={expandedAccordion === 'division'}
              onPress={() =>
                setExpandedAccordion(expandedAccordion === 'division' ? null : 'division')
              }
              divisionName={division.name}
              teams={teams || []}
            />
          </View>
          <View className="gap-3 bg-bg-1 p-3 py-6">
            <View className="">
              <Heading text="Fixtures" />
            </View>
            <FixturesAccordion
              isExpanded={expandedAccordion === 'fixtures'}
              onPress={() =>
                setExpandedAccordion(expandedAccordion === 'fixtures' ? null : 'fixtures')
              }
              season={currentRole.activeSeason}
              competitionInstance={currentSeasonComp}
            />
          </View>
        </ScrollView>
      </SafeViewWrapper>
      <BottomSheetModal
        showModal={showModal}
        setShowModal={setShowModal}
        title={division.name + ' settings' || 'Division Settings'}>
        <ScrollView className="flex-1 p-5">
          <Text className="font-saira text-text-2">
            This is where you can manage your division settings, teams, fixtures, and more. This
            feature is coming soon!
          </Text>
        </ScrollView>
      </BottomSheetModal>
    </>
  );
};

export default DivisionOverview;

const styles = StyleSheet.create({});
