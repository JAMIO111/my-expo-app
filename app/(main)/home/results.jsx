import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { getSeasonLabel } from '@lib/helperFunctions';
import { Stack } from 'expo-router';
import ModalDropdown from '@components/ModalDropdown';
import ResultsTable from '@components/ResultsTable';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';

const Results = () => {
  const seasonStartDay = '01'; // e.g. August 1, 2025
  const seasonStartMonth = '08'; // e.g. August
  const seasonEndDay = '16'; // e.g. July 31, 2026
  const seasonEndMonth = '05'; // e.g. July
  const [season, setSeason] = useState(
    getSeasonLabel(seasonStartDay, seasonStartMonth, seasonEndDay, seasonEndMonth)
  );
  console.log('Current season:', season);
  const [district, setDistrict] = useState('Blyth');
  const [competition, setCompetition] = useState('Super League');
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Results" />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
        className="mt-16 w-full flex-1 bg-bg-grouped-1">
        <View className="h-fit w-full items-center justify-between gap-3 bg-brand p-3">
          <View className="flex-row gap-3">
            <ModalDropdown
              value={district}
              onChange={setDistrict}
              placeholder="district"
              options={['Blyth', 'Bedlington', 'Amble']}
            />
          </View>
          <View className="flex-row gap-3">
            <ModalDropdown
              value={competition}
              onChange={setCompetition}
              placeholder="competition"
              options={['Super League', 'Premier League', 'Division 1']}
            />
            <ModalDropdown
              value={season}
              onChange={setSeason}
              placeholder="season"
              options={['2025/26', '2024/25', '2023/24', '2022/23', '2021/22', '2020/21']}
            />
          </View>
        </View>
        <ResultsTable />
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Results;

const styles = StyleSheet.create({});
