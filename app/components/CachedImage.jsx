import { Image, ActivityIndicator, Text } from 'react-native';
import useCachedImage from '@hooks/useCachedImage';

const CachedImage = ({ avatarUrl, width = 100, height = 100, borderRadius = 50 }) => {
  const { localUri, loading, error } = useCachedImage(avatarUrl);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error loading image</Text>;

  return (
    <Image
      source={{ uri: localUri }}
      style={{ width: width, height: height, borderRadius: borderRadius }}
    />
  );
};
export default CachedImage;
