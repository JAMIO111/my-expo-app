import { useState } from 'react';
import { View, Image, Text, Pressable, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import IonIcon from 'react-native-vector-icons/Ionicons';

const ImageUploader = ({
  initialUri = null,
  onImageChange = () => {},
  editable = true,
  aspectRatio = [1, 1],
  size = 200, // only applies to square aspect
  borderRadius = 16,
}) => {
  const [imageUri, setImageUri] = useState(initialUri);
  const screenWidth = Dimensions.get('window').width;
  const [aspectW, aspectH] = aspectRatio;

  // Square = use fixed size, else use screen width and calculated height
  const isSquare = aspectW === aspectH;

  const imageWidth = isSquare ? size : screenWidth;
  const imageHeight = isSquare ? size : (screenWidth * aspectH) / aspectW;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission Denied', 'You need to allow media access.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      aspect: aspectRatio,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      onImageChange(manipResult.uri);
    }
  };

  return (
    <Pressable onPress={editable ? pickImage : undefined}>
      {initialUri ? (
        <Image
          source={{ uri: initialUri }}
          style={{
            width: imageWidth,
            height: imageHeight,
            borderRadius: borderRadius,
            borderWidth: 2,
            marginBottom: 16,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: imageWidth,
            height: imageHeight,
            borderRadius: borderRadius,
            borderWidth: 2,
            borderColor: '#ccc',
            backgroundColor: '#f0f0f0',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
          <IonIcon name="camera-outline" size={40} color="#888" />
          <Text style={{ marginTop: 10, fontSize: 16, color: '#444' }}>Tap to upload photo</Text>
        </View>
      )}
    </Pressable>
  );
};

export default ImageUploader;
