import { Text } from 'react-native';

const Heading = ({ text, className }) => {
  return (
    <Text className={`pl-1 text-left font-saira-medium text-2xl text-text-1 ${className}`}>
      {text}
    </Text>
  );
};

export default Heading;
