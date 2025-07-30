import { StyleSheet, Text, View, Image, Pressable, onPress } from 'react-native';

const HomeScreenCardLarge = ({ title, body, category, image, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="w-full items-center justify-between overflow-hidden rounded-2xl bg-bg-grouped-2 shadow">
      <Image
        source={image}
        style={{ resizeMode: 'cover', height: 220, width: '100%' }}
        className="rounded-2xl"
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

const styles = StyleSheet.create({});
