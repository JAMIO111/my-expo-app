import { StyleSheet, View } from 'react-native';
import ResultCard from './ResultCard';

const ResultsTable = () => {
  return (
    <View className="w-full flex-1 items-center justify-center gap-2 p-2">
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
      <ResultCard />
    </View>
  );
};

export default ResultsTable;

const styles = StyleSheet.create({});
