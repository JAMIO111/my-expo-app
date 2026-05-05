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
import CTAButton from '@components/CTAButton';
import EditDivisionForm from '@components/EditDivisionForm';
import GenerateFixturesForm from '@components/GenerateFixturesForm';
import { useDivisions } from '@hooks/useDivisions';
import { useCompetitions } from '@hooks/useCompetitions';

const DivisionOverview = () => {
  const { currentRole } = useUser();
  const { divisionId } = useLocalSearchParams();
  const { data: divisions } = useDivisions(currentRole?.district?.id);
  const {
    data: teams,
    isLoading: isTeamsLoading,
    isError: isTeamsError,
  } = useTeamsByDivision(divisionId);
  const {
    data: LeagueCompetition,
    isLoading: isCompetitionsLoading,
    isError: isCompetitionsError,
  } = useCompetitions({
    divisionId: divisionId,
    competitionType: 'league',
  });
  console.log('Competitions in Division Overview:', LeagueCompetition);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [competitionInstance, setCompetitionInstance] = useState(null);
  const [showDetails, setShowDetails] = useState(true);
  const [showActiveCompetition, setShowActiveCompetition] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const division = divisions?.find((d) => d.id === divisionId) || {};

  const currentSeasonComp = currentRole?.competitions?.find(
    (comp) =>
      LeagueCompetition?.[0]?.id === comp.competition_id &&
      comp.season_id === currentRole.activeSeason.id
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
                  setModalType('edit-division');
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
          <View className="bg-bg-1">
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
                      {division.promotion_spots || 'No promotions'}
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
          <ExpandableView
            title="Active Competition"
            show={showActiveCompetition}
            setShow={setShowActiveCompetition}
            fixedOpen={!currentSeasonComp && !isCompetitionsLoading}>
            {!currentRole?.activeSeason ? (
              <View className="mb-4 rounded-2xl bg-bg-2 px-4 py-1 shadow-sm">
                <Text className="px-1 py-3 text-center font-saira text-lg text-text-2">
                  There is no active season. Please come back once the new season has been
                  initiated.
                </Text>
              </View>
            ) : !currentSeasonComp && !isCompetitionsLoading ? (
              <View className="mx-2 my-2">
                <CTAButton
                  type="yellow"
                  text={`Initiate ${currentRole?.activeSeason?.name} competition`}
                  callbackFn={() => {
                    setShowModal(true);
                    setModalType('initiate-competition');
                  }}
                />
                <Text className="mt-4 px-2 font-saira text-sm text-text-2">
                  You haven't initiated a competition for the {currentRole.activeSeason.name} season
                  yet. Please initiate a competition to start adding fixtures and teams.
                </Text>
              </View>
            ) : (
              <View className="mb-4 gap-2 rounded-2xl bg-bg-2 p-4 shadow-sm">
                <Text className="font-saira-semibold text-xl text-text-1">
                  {`${currentRole?.activeSeason?.name} ${currentSeasonComp?.name || 'Competition'} - ${currentSeasonComp?.status

                    .charAt(0)
                    .toUpperCase()}${currentSeasonComp?.status.slice(1)}`}
                </Text>
                <Text className="font-saira-medium text-text-2">{`Initiated ${new Date(
                  currentSeasonComp?.created_at
                ).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}</Text>
              </View>
            )}
          </ExpandableView>
          {currentSeasonComp && (
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
              {currentRole?.type === 'admin' &&
                currentSeasonComp &&
                !currentSeasonComp?.fixtures_generated && (
                  <View className="mt-3">
                    <CTAButton
                      type="yellow"
                      text={`Generate ${currentRole.activeSeason.name} fixtures`}
                      callbackFn={() => {
                        setModalType('generate-fixtures');
                        setShowModal(true);
                      }}
                    />
                  </View>
                )}
            </View>
          )}
          <View className="gap-3 bg-bg-1 p-3 py-6">
            <View className="">
              <Heading text="Division Members" />
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
        </ScrollView>
      </SafeViewWrapper>
      <BottomSheetModal
        showModal={showModal}
        setShowModal={setShowModal}
        title={
          modalType === 'generate-fixtures'
            ? `Generate ${currentRole.activeSeason.name} Fixtures`
            : modalType === 'edit-division'
              ? `${division.name} Settings`
              : `Initiate ${division.name} Competition`
        }>
        {modalType === 'generate-fixtures' ? (
          <GenerateFixturesForm
            competitionInstanceId={currentSeasonComp.id}
            closeModal={() => setShowModal(false)}
          />
        ) : modalType === 'edit-division' || modalType === 'initiate-competition' ? (
          <EditDivisionForm
            competition={LeagueCompetition?.[0]}
            division={division}
            participants={teams}
            closeModal={() => setShowModal(false)}
            context={modalType}
          />
        ) : null}
      </BottomSheetModal>
    </>
  );
};

export default DivisionOverview;

const styles = StyleSheet.create({});
