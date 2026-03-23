import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useLocalSearchParams } from 'expo-router';
import DivisionAccordion from '@components/DivisionAccordion';
import { useTeamsByDivision } from '@hooks/useTeamsByDivision';
import FixturesAccordion from '@components/FixturesAccordion';

const DivisionOverview = () => {
  const { currentRole } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const division = params.divisionStr ? JSON.parse(params.divisionStr) : {};
  const { data: teams, isLoading, isError } = useTeamsByDivision(division.id);
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  console.log('Division Overview for:', division);
  console.log('Teams in Division:', teams);
  console.log('Error loading teams:', isError);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title={division.name || 'My Division'} />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{ gap: 16, marginVertical: 64, paddingBottom: 32 }}
          className="flex-1 bg-brand p-3">
          <DivisionAccordion
            isExpanded={expandedAccordion === 'division'}
            onPress={() =>
              setExpandedAccordion(expandedAccordion === 'division' ? null : 'division')
            }
            divisionName={division.name}
            teams={teams || []}
          />
          <FixturesAccordion
            isExpanded={expandedAccordion === 'fixtures'}
            onPress={() =>
              setExpandedAccordion(expandedAccordion === 'fixtures' ? null : 'fixtures')
            }
            season={currentRole.activeSeason}
            division={division}
          />
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default DivisionOverview;

const styles = StyleSheet.create({});
