import { StyleSheet, Text, View, Pressable, useColorScheme, ScrollView } from 'react-native';
import { useState } from 'react';
import TeamLogo from '@components/TeamLogo';
import CTAButton from '@components/CTAButton';
import ColorPickerGrid from '@components/ColorPickerGrid';
import BottomSheetModal from '@components/BottomSheetModal';
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
  'Stripes',
  'Hoops',
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

const CrestEditor = ({ crest, handleSave, buttonText = 'Save Changes' }) => {
  const [primaryColor, setPrimaryColor] = useState(crest?.color1 || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(crest?.color2 || '#FFFFFF'); //Yellow
  const [thickness, setThickness] = useState(crest?.thickness || '2.7');
  const [type, setType] = useState(crest?.type || 'Horizontal Stripe'); // Assuming 'default' is a valid type
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  const [activeMenu, setActiveMenu] = useState(null);

  const hasChanges = () => {
    return (
      primaryColor !== crest?.color1 ||
      secondaryColor !== crest?.color2 ||
      thickness !== crest?.thickness ||
      type !== crest?.type
    );
  };

  return (
    <View className="flex-1 items-center justify-start gap-8 bg-bg-grouped-1 p-5">
      <TeamLogo
        color1={primaryColor}
        color2={secondaryColor}
        thickness={thickness}
        type={type}
        size={150}
      />
      <View style={{ borderRadius: 20 }} className="w-full gap-3 bg-bg-1 p-3 shadow-sm">
        <Pressable
          onPress={() => {
            setActiveMenu('Crest Type');
          }}
          className="flex-row items-center justify-between rounded-2xl bg-bg-2 p-2 py-4 shadow-sm">
          <Text className="font-saira text-2xl text-text-2">Type</Text>
          <Text className="font-saira-medium text-2xl text-text-1">
            {TYPES.find((item) => item === type) || 'Horizontal Stripe'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveMenu('Primary Color');
          }}
          className="flex-row items-center justify-between rounded-2xl bg-bg-2 p-2 shadow-sm">
          <Text className="font-saira text-2xl text-text-2">Primary Team Color</Text>
          <View
            className="h-12 w-12 rounded-full border border-theme-gray-5"
            style={{
              backgroundColor: primaryColor || '#000000',
            }}></View>
        </Pressable>

        <Pressable
          onPress={() => {
            setActiveMenu('Secondary Color');
          }}
          className="flex-row items-center justify-between rounded-2xl bg-bg-2 p-2 shadow-sm">
          <Text className="font-saira text-2xl text-text-2">Secondary Team Color</Text>
          <View
            className="h-12 w-12 rounded-full border border-theme-gray-5"
            style={{ backgroundColor: secondaryColor || '#FFFFFF' }}></View>
        </Pressable>
        {type !== 'Solids' && type !== 'Quartered' && (
          <Pressable
            onPress={() => {
              setActiveMenu('Style Weight');
            }}
            className="flex-row items-center justify-between rounded-2xl bg-bg-2 p-2 py-4 shadow-sm">
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
            type="yellow"
            text={buttonText}
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
      <BottomSheetModal
        title={`Select a ${activeMenu}`}
        showModal={!!activeMenu}
        setShowModal={() => setActiveMenu(null)}>
        {/* Scrollable content with top padding to avoid overlap */}
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 240,
            paddingTop: 40,
            paddingHorizontal: 20,
            gap: 8,
          }}>
          {/* Your selectable items */}
          {activeMenu === 'Style Weight' &&
            THICKNESSES.map((item, index) => (
              <Pressable
                className={`flex-row items-center justify-between pb-4 pt-2 ${index < THICKNESSES.length - 1 ? 'border-b border-theme-gray-3' : ''}`}
                key={index}
                onPress={() => {
                  setThickness(item.value);
                  setActiveMenu(null);
                }}>
                <TeamLogo
                  size={30}
                  type={type}
                  color1={primaryColor}
                  color2={secondaryColor}
                  thickness={item.value}
                />
                <Text
                  className={`flex-1 pl-5 text-left font-saira text-2xl ${
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
                className={`flex-row items-center justify-between pb-4 pt-2 ${index < TYPES.length - 1 ? 'border-b border-theme-gray-3' : ''}`}
                key={index}
                onPress={() => {
                  setType(item);
                  setActiveMenu(null);
                }}>
                <TeamLogo
                  size={30}
                  type={item}
                  color1={primaryColor}
                  color2={secondaryColor}
                  thickness={thickness}
                />
                <Text
                  className={`flex-1 pl-5 text-left font-saira text-2xl ${
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
                  setActiveMenu(null);
                } else if (activeMenu === 'Secondary Color' && secondaryColor !== color) {
                  setSecondaryColor(color);
                  setActiveMenu(null);
                }
              }}
            />
          )}
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
};

export default CrestEditor;

const styles = StyleSheet.create({});
