import { Text } from 'react-native';

const Heading = ({ text, className }) => {
  return (
    <Text className={`font-tektur-semibold pl-1 text-left text-2xl text-text-1 ${className}`}>
      {text}
    </Text>
  );
};

export default Heading;
