import { StyleSheet, Text, View } from 'react-native';

const Heading = ({ text }) => {
  return (
    <Text className="mt-8 w-full text-left font-saira-bold text-3xl text-brand-light">{text}</Text>
  );
};

export default Heading;
