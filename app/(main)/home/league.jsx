import { StyleSheet, ScrollView, Text, View } from 'react-native';
import React, { useState } from 'react';
import LeagueTable from 'components/LeagueTable';
import ModalDropdown from 'components/ModalDropdown';
import { getSeasonLabel } from 'lib/helperFunctions';

const league = () => {
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
    <React.Fragment>
      <View className="bg-brand h-16 items-center justify-center">
        <Text className="font-michroma text-center text-2xl font-bold text-white">Tables</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
        className="w-full flex-1 bg-white">
        <View className="bg-brand h-fit w-full items-center justify-between gap-3 p-3">
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
        <LeagueTable />
      </ScrollView>
    </React.Fragment>
  );
};

export default league;

const styles = StyleSheet.create({});
