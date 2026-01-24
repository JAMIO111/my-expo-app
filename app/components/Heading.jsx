import { Text } from 'react-native';

const Heading = ({ text }) => {
  return (
    <Text className="w-full pb-1 pl-2 text-left font-saira-medium text-3xl text-text-1">
      {text}
    </Text>
  );
};

export default Heading;
