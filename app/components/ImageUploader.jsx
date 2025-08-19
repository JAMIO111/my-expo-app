import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Image, Text, Pressable, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import IonIcon from 'react-native-vector-icons/Ionicons';

const ImageUploader = forwardRef(
  (
    {
      initialUri = null,
      onImageChange = () => {},
      editable = true,
      aspectRatio = [1, 1],
      size = 200, // Only for square aspect
      borderRadius = 16,
    },
    ref
  ) => {
    const [imageUri, setImageUri] = useState(initialUri);
    const screenWidth = Dimensions.get('window').width;
    const [aspectW, aspectH] = aspectRatio;

    const isSquare = aspectW === aspectH;
    const imageWidth = isSquare ? size : screenWidth;
    const imageHeight = isSquare ? size : (screenWidth * aspectH) / aspectW;

    // Keep local state synced with initialUri
    useEffect(() => {
      setImageUri(initialUri);
    }, [initialUri]);

    const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission Denied', 'You need to allow media access.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 512 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const previousUri = imageUri;
        setImageUri(manipResult.uri); // optimistic UI update

        // Notify parent and let them handle upload/failure
        onImageChange(manipResult.uri, previousUri);
      }
    };

    // Expose pickImage to parent
    useImperativeHandle(ref, () => ({
      openPicker: pickImage,
    }));

    return (
      <Pressable onPress={editable ? pickImage : undefined}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius,
              backgroundColor: '#f0f0f0',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <IonIcon name="camera-outline" size={40} color="#888" />
            <Text
              style={{
                marginTop: 10,
                fontSize: 18,
                color: '#444',
                paddingHorizontal: 12,
                textAlign: 'center',
                fontFamily: 'Saira-Regular',
                lineHeight: 20,
              }}>
              Tap to upload photo
            </Text>
          </View>
        )}
      </Pressable>
    );
  }
);

export default ImageUploader;
