import { StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useLocalSearchParams } from 'expo-router';
import DivisionAccordion from './division-accordion';
import { useTeamsByDivision } from '@hooks/useTeamsByDivision';

const DivisionOverview = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const division = params.divisionStr ? JSON.parse(params.divisionStr) : {};
  const { data: teams, isLoading, isError } = useTeamsByDivision(division.id);

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
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView className="mt-16 flex-1 bg-brand p-4">
          <DivisionAccordion divisionName={division.name} teams={teams || []} />
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default DivisionOverview;

const styles = StyleSheet.create({});
