import { StyleSheet, Text, View } from 'react-native';

const Heading = ({ text }) => {
  return (
    <Text className="w-full pl-2 text-left font-saira-medium text-3xl text-text-2">{text}</Text>
  );
};

export default Heading;
