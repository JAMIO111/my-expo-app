import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React from 'react';
import ModalDropdown from 'components/ModalDropdown';
import ResultsTable from 'components/ResultsTable';

const Results = () => {
  return (
    <React.Fragment>
      <View className="bg-brand h-16 items-center justify-center">
        <Text className="font-michroma text-center text-2xl font-bold text-white">Results</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}
        className="bg-background-dark w-full flex-1">
        <View className="bg-brand h-fit w-full items-center justify-between gap-3 p-3">
          <View className="flex-row gap-3">
            <ModalDropdown placeholder="district" options={['Blyth', 'Bedlington', 'Amble']} />
          </View>
          <View className="flex-row gap-3">
            <ModalDropdown
              placeholder="competition"
              options={['Super League', 'Premier League', 'Division 1']}
            />
            <ModalDropdown
              placeholder="season"
              options={['2025/26', '2024/25', '2023/24', '2022/23', '2021/22', '2020/21']}
            />
          </View>
        </View>
        <ResultsTable />
      </ScrollView>
    </React.Fragment>
  );
};

export default Results;

const styles = StyleSheet.create({});
