import { StyleSheet, ScrollView } from 'react-native';
import BasicPaywall from '@components/BasicPaywall';
import SafeViewWrapper from '@components/SafeViewWrapper';
import NavBar from '@components/NavBar2';
import CustomHeader from '@components/CustomHeader';

const Upgrade = () => {
  return (
    <SafeViewWrapper bottomColor="bg-brand" useTopInset={false} topColor="bg-brand-dark">
      <CustomHeader title="Get Full Access" showBack={false} />
      <ScrollView className="flex-1 bg-brand-dark">
        <BasicPaywall />
      </ScrollView>
      <NavBar type="onboarding" />
    </SafeViewWrapper>
  );
};

export default Upgrade;

const styles = StyleSheet.create({});
