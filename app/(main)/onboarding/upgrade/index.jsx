import BasicPaywall from '@components/BasicPaywall';
import SafeViewWrapper from '@components/SafeViewWrapper';
import NavBar from '@components/NavBar2';
import CustomHeader from '@components/CustomHeader';

const Upgrade = () => {
  return (
    <SafeViewWrapper bottomColor="bg-brand" useTopInset={false} topColor="bg-brand-dark">
      <CustomHeader title="Get Full Access" showBack={false} />
      <BasicPaywall />
      <NavBar type="onboarding" />
    </SafeViewWrapper>
  );
};

export default Upgrade;
