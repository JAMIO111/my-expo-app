import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import TeamLogo from './TeamLogo';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';

const THICKNESSES = [
  {
    label: 'Thin',
    value: 4,
  },
  {
    label: 'Medium',
    value: 3,
  },
  {
    label: 'Thick',
    value: 2,
  },
];

const TYPES = [
  'Solids',
  'Horizontal Stripe',
  'Vertical Stripe',
  'Spots',
  'Diagonal Stripe',
  'Diagonal Stripe Reverse',
];

const CrestEditor = () => {
  const { currentRole } = useUser();
  const [primaryColor, setPrimaryColor] = useState(currentRole?.team?.crest?.color1 || '#FF0000');
  const [secondaryColor, setSecondaryColor] = useState(
    currentRole?.team?.crest?.color2 || '#0000FF'
  );
  const [thickness, setThickness] = useState(currentRole?.team?.crest?.thickness || 3);
  const [type, setType] = useState(currentRole?.team?.crest?.type || 'solids'); // Assuming 'default' is a valid type
  const hasChanges = () => {
    return (
      primaryColor !== currentRole?.team?.crest?.color1 ||
      secondaryColor !== currentRole?.team?.crest?.color2 ||
      thickness !== currentRole?.team?.crest?.thickness ||
      type !== currentRole?.team?.crest?.type
    );
  };
  return (
    <View className="flex-1 items-center justify-start gap-12 bg-bg-grouped-1">
      <TeamLogo
        color1={primaryColor}
        color2={secondaryColor}
        thickness={thickness}
        type={type}
        size={150}
      />
      <View className="w-full gap-3 rounded-2xl bg-bg-grouped-2 p-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-saira text-2xl text-text-1">Type</Text>
          <Text className="font-saira text-2xl text-text-1">
            {TYPES.find((item) => item === type) || 'Solids'}
          </Text>
        </View>
        <View className="border-b border-theme-gray-5"></View>
        <View className="flex-row items-center justify-between">
          <Text className="font-saira text-2xl text-text-1">Primary Team Color</Text>
          <View
            className="h-12 w-12 rounded-full"
            style={{
              backgroundColor: primaryColor || 'white',
            }}></View>
        </View>
        <View className="border-b border-theme-gray-5"></View>
        <View className="flex-row items-center justify-between">
          <Text className="font-saira text-2xl text-text-1">Secondary Team Color</Text>
          <View
            className="h-12 w-12 rounded-full"
            style={{ backgroundColor: secondaryColor || 'black' }}></View>
        </View>
        <View className="border-b border-theme-gray-5"></View>
        {type !== 'solids' && (
          <View className="flex-row items-center justify-between">
            <Text className="font-saira text-2xl text-text-1">Thickness</Text>
            <Text>{THICKNESSES.find((item) => item.value === thickness)?.label}</Text>
          </View>
        )}
      </View>
      {hasChanges() && (
        <View className="w-full">
          <CTAButton type="success" text="Save Changes" />
        </View>
      )}
    </View>
  );
};

export default CrestEditor;

const styles = StyleSheet.create({});
