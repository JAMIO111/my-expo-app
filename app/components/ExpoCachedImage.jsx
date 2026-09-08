import { Image } from 'expo-image';
import { ActivityIndicator, View } from 'react-native';
import { useState } from 'react';

const ExpoCachedImage = ({
  uri,
  width = 100,
  height = 100,
  borderRadius = 50,
  contentFit = 'cover',
  showLoader = true,
}) => {
  const [loading, setLoading] = useState(!!uri);

  const style = {
    width,
    height,
    borderRadius,
  };

  if (!uri) {
    return <View style={style} />;
  }

  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={style}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={200}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />

      {showLoader && loading && (
        <View
          style={{
            ...style,
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  );
};

export default ExpoCachedImage;
