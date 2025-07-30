import { StyleSheet, Text, View } from 'react-native';

const Heading = ({ text }) => {
  return (
    <Text className="mt-8 w-full text-left font-saira-semibold text-3xl text-text-2">{text}</Text>
  );
};

export default Heading;
