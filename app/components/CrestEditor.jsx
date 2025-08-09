import { StyleSheet, Text, View, Pressable, useColorScheme } from 'react-native';
import { useState, useRef } from 'react';
import TeamLogo from '@components/TeamLogo';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';
import ColorPickerGrid from '@components/ColorPickerGrid';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetView, BottomSheetScrollView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors';

const THICKNESSES = [
  {
    label: 'Thin',
    value: '4',
  },
  {
    label: 'Medium',
    value: '2.7',
  },
  {
    label: 'Thick',
    value: '2',
  },
];

const TYPES = [
  'Solids',
  'Horizontal Stripe',
  'Vertical Stripe',
  'Spots',
  'Diagonal Stripe',
  'Diagonal Stripe Reverse',
  'Cross',
  'Diagonal Cross',
  'Checkerboard',
  'Polka Dots',
  'Border',
  'Quartered',
];

const CrestEditor = ({ handleSave }) => {
  const bottomSheetRef = useRef(null);
  const { currentRole } = useUser();
  const [primaryColor, setPrimaryColor] = useState(currentRole?.team?.crest?.color1 || '#FF0000');
  const [secondaryColor, setSecondaryColor] = useState(
    currentRole?.team?.crest?.color2 || '#0000FF'
  );
  const [thickness, setThickness] = useState(currentRole?.team?.crest?.thickness || 3);
  const [type, setType] = useState(currentRole?.team?.crest?.type || 'solids'); // Assuming 'default' is a valid type
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  const [activeMenu, setActiveMenu] = useState(null);

  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const hasChanges = () => {
    return (
      primaryColor !== currentRole?.team?.crest?.color1 ||
      secondaryColor !== currentRole?.team?.crest?.color2 ||
      thickness !== currentRole?.team?.crest?.thickness ||
      type !== currentRole?.team?.crest?.type
    );
  };

  return (
    <View className="flex-1 items-center justify-start gap-12 bg-bg-grouped-1 p-5">
      <TeamLogo
        color1={primaryColor}
        color2={secondaryColor}
        thickness={thickness}
        type={type}
        size={150}
      />
      <View className="w-full gap-3 rounded-2xl bg-bg-grouped-2 p-3">
        <Pressable
          onPress={() => {
            setActiveMenu('Crest Type');
            openSheet();
          }}
          className="flex-row items-center justify-between py-2">
          <Text className="font-saira text-2xl text-text-2">Type</Text>
          <Text className="font-saira-medium text-2xl text-text-1">
            {TYPES.find((item) => item === type) || 'Solids'}
          </Text>
        </Pressable>
        <View className="border-b border-theme-gray-5"></View>
        <Pressable
          onPress={() => {
            setActiveMenu('Primary Color');
            openSheet();
          }}
          className="flex-row items-center justify-between">
          <Text className="font-saira text-2xl text-text-2">Primary Team Color</Text>
          <View
            className="h-12 w-12 rounded-full"
            style={{
              backgroundColor: primaryColor || 'white',
            }}></View>
        </Pressable>
        <View className="border-b border-theme-gray-5"></View>
        <Pressable
          onPress={() => {
            setActiveMenu('Secondary Color');
            openSheet();
          }}
          className="flex-row items-center justify-between">
          <Text className="font-saira text-2xl text-text-2">Secondary Team Color</Text>
          <View
            className="h-12 w-12 rounded-full"
            style={{ backgroundColor: secondaryColor || 'black' }}></View>
        </Pressable>
        <View className="border-b border-theme-gray-5"></View>
        {type !== 'solids' && (
          <Pressable
            onPress={() => {
              setActiveMenu('Style Weight');
              openSheet();
            }}
            className="flex-row items-center justify-between py-2">
            <Text className="font-saira text-2xl text-text-2">Thickness</Text>
            <Text className="font-saira-medium text-2xl text-text-1">
              {THICKNESSES.find((item) => item.value === thickness)?.label}
            </Text>
          </Pressable>
        )}
      </View>
      {hasChanges() && (
        <View className="w-full">
          <CTAButton
            type="success"
            text="Save Changes"
            callbackFn={() => {
              console.log('Saving changes:', {
                type,
                color1: primaryColor,
                color2: secondaryColor,
                thickness,
              });
              handleSave({
                type,
                color1: primaryColor,
                color2: secondaryColor,
                thickness,
              });
            }}
          />
        </View>
      )}
      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        marginTop={200}
        snapPoints={['80%']}>
        {/* Fixed Header */}
        <BottomSheetView
          style={{
            paddingHorizontal: 32,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            backgroundColor: themeColors.bgGrouped2,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
            Select {activeMenu}
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Scrollable content with top padding to avoid overlap */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 240, paddingTop: 80, paddingHorizontal: 32 }}>
          {/* Your selectable items */}
          {activeMenu === 'Style Weight' &&
            THICKNESSES.map((item, index) => (
              <Pressable
                className="mb-5 flex-row items-center justify-between"
                key={index}
                onPress={() => setThickness(item.value)}>
                <Text
                  className={`font-saira text-2xl ${
                    thickness === item.value ? 'text-text-1' : 'text-text-2'
                  }`}>
                  {item.label}
                </Text>
                <Ionicons
                  size={24}
                  color={themeColors.primaryText}
                  name={thickness === item.value ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}

          {activeMenu === 'Crest Type' &&
            TYPES.map((item, index) => (
              <Pressable
                className="mb-5 flex-row items-center justify-between"
                key={index}
                onPress={() => setType(item)}>
                <Text
                  className={`font-saira text-2xl ${
                    type === item ? 'text-text-1' : 'text-text-2'
                  }`}>
                  {item}
                </Text>
                <Ionicons
                  size={24}
                  color={themeColors.primaryText}
                  name={type === item ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}

          {(activeMenu === 'Primary Color' || activeMenu === 'Secondary Color') && (
            <ColorPickerGrid
              onSelect={(color) => {
                if (activeMenu === 'Primary Color' && primaryColor !== color) {
                  setPrimaryColor(color);
                } else if (activeMenu === 'Secondary Color' && secondaryColor !== color) {
                  setSecondaryColor(color);
                }
              }}
            />
          )}
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </View>
  );
};

export default CrestEditor;

const styles = StyleSheet.create({});
