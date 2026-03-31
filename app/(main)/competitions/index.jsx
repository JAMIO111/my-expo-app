import { StyleSheet, View, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useCompetitionInstances } from '@hooks/useCompetitionInstances';
import CompetitionInstanceCard from '@components/CompetitionInstanceCard';

const index = () => {
  const { loading, currentRole } = useUser();
  const { data: competitionsInstances, isLoading: isCompetitionsLoading } = useCompetitionInstances(
    currentRole?.activeSeason.id
  );
  console.log('Competitions:', competitionsInstances);
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                showBack={false}
                title={`${currentRole?.district?.name} Competitions`}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper bottomColor="bg-brand" topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{ display: 'flex', flexGrow: 1, gap: 16, paddingVertical: 20 }}
          className="mt-16 flex-1 bg-brand px-4">
          {competitionsInstances?.map((instance) => (
            <CompetitionInstanceCard key={instance.id} instance={instance} />
          ))}
        </ScrollView>
        <NavBar />
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
