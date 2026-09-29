import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import SelectionSettingsItem from '@components/SelectionSettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useTheme } from '@contexts/ThemeProvider';
import { accents as accentPalettes } from '@lib/theme';
import ProGate from '@components/ProGate';

const MODE_OPTIONS = [
  { value: 'system', title: 'Use Device Setting' },
  { value: 'light', title: 'Light' },
  { value: 'dark', title: 'Dark' },
];

const ACCENT_OPTIONS = [
  { value: 'green', title: 'Green', pro: false },
  { value: 'blue', title: 'Blue', pro: false },
  { value: 'teal', title: 'Teal', pro: true },
  { value: 'red', title: 'Red', pro: true },
];

const Appearance = () => {
  const { mode, setMode, accents, setAccent, scheme } = useTheme();

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Appearance" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer title="Mode">
          {MODE_OPTIONS.map((option, index) => (
            <SelectionSettingsItem
              key={option.value}
              title={option.title}
              value={mode}
              internalValue={option.value}
              setValue={setMode}
              lastItem={index === MODE_OPTIONS.length - 1}
            />
          ))}
        </MenuContainer>

        {['light', 'dark'].map((forScheme) => (
          <MenuContainer
            key={forScheme}
            title={forScheme === 'light' ? 'Light Mode Colour' : 'Dark Mode Colour'}
            footer={
              forScheme === scheme ? 'This is the colour theme you are seeing now.' : undefined
            }>
            {ACCENT_OPTIONS.map((option, index) => {
              const item = (
                <SelectionSettingsItem
                  key={option.value}
                  title={option.title}
                  value={accents[forScheme]}
                  internalValue={option.value}
                  setValue={(value) => setAccent(forScheme, value)}
                  swatchColor={accentPalettes[option.value][forScheme].js.brandNormal}
                  lastItem={index === ACCENT_OPTIONS.length - 1}
                />
              );

              return option.pro ? (
                <ProGate mode="click" pro={true} key={option.value}>
                  {item}
                </ProGate>
              ) : (
                item
              );
            })}
          </MenuContainer>
        ))}
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Appearance;
