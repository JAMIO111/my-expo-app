import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Image, Text, Pressable, Alert } from 'react-native';
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
      size = 200,
      borderRadius = 16,
    },
    ref
  ) => {
    const [imageUri, setImageUri] = useState(initialUri);
    const [containerWidth, setContainerWidth] = useState(0);

    const [aspectW, aspectH] = aspectRatio;
    const isSquare = aspectW === aspectH;

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
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const { uri, width, height } = asset;

      const targetRatio = aspectW / aspectH;
      let crop;

      if (width / height > targetRatio) {
        const newWidth = height * targetRatio;
        crop = {
          originX: (width - newWidth) / 2,
          originY: 0,
          width: newWidth,
          height,
        };
      } else {
        const newHeight = width / targetRatio;
        crop = {
          originX: 0,
          originY: (height - newHeight) / 2,
          width,
          height: newHeight,
        };
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop }, { resize: { width: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const previousUri = imageUri;
      setImageUri(manipResult.uri);
      onImageChange(manipResult.uri, previousUri);
    };

    const removeImage = () => {
      const previousUri = imageUri;
      setImageUri(null);
      onImageChange(null, previousUri);
    };

    useImperativeHandle(ref, () => ({
      openPicker: pickImage,
    }));

    const imageWidth = isSquare ? size : '100%';
    const imageHeight = isSquare ? size : containerWidth ? (containerWidth * aspectH) / aspectW : 0;

    return (
      <Pressable onPress={editable ? pickImage : undefined}>
        <View
          style={{ width: '100%', position: 'relative' }}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: imageWidth,
                  height: imageHeight,
                  borderRadius,
                }}
                resizeMode="cover"
              />

              {editable && (
                <Pressable
                  onPress={removeImage}
                  hitSlop={10}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 14,
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <IonIcon name="close" size={16} color="#fff" />
                </Pressable>
              )}
            </>
          ) : (
            <View
              style={{
                width: imageWidth,
                height: imageHeight || size,
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
        </View>
      </Pressable>
    );
  }
);

export default ImageUploader;
