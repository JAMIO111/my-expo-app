import { Text, View, Image, Pressable } from 'react-native';

const HomeScreenCardLarge = ({ title, body, category, image, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="w-full items-center justify-between rounded-3xl bg-bg-1 p-1 shadow-md">
      <Image
        source={image}
        style={{ resizeMode: 'cover', height: 220, width: '100%', borderRadius: 18 }}
      />
      <View className="w-full items-center justify-center gap-1 p-4">
        <Text className="mb-2 w-full text-left font-saira-semibold text-2xl text-text-1">
          {title}
        </Text>
        <Text className="w-full text-left font-saira-regular text-text-2">{body}</Text>
        <Text className="w-full text-left font-saira-regular text-text-3">{category}</Text>
      </View>
    </Pressable>
  );
};

export default HomeScreenCardLarge;
