import { StyleSheet, Text, View, Image, Pressable, Alert, useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import supabase from '@/lib/supabaseClient.js';
import uuid from 'react-native-uuid';
import CTAButton from '@components/CTAButton';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import StepPillGroup from '@components/StepPillGroup';
import IonIcon from 'react-native-vector-icons/Ionicons';

const PROJECT_URL = 'https://ionhcfjampzewimsgsmr.supabase.co'; // Replace with your actual Supabase project URL

const ProfileCreation4 = () => {
  const { colorScheme } = useColorScheme();
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow media access.');
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uriToBlob = async (uri) => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const ext = uri.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'gif') mimeType = 'image/gif';

    const dataUrl = `data:${mimeType};base64,${base64}`;
    const blob = await fetch(dataUrl).then((r) => r.blob());
    return { blob, mimeType };
  };

  const uploadToSupabaseManually = async (blob, filePath, mimeType) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const uploadUrl = `${PROJECT_URL}/storage/v1/object/avatars/${filePath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: blob,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    return `${PROJECT_URL}/storage/v1/object/public/avatars/${filePath}`;
  };

  const handleSaveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setUploading(true);
    let avatarUrl = null;

    try {
      if (imageUri) {
        const { blob, mimeType } = await uriToBlob(imageUri);
        const fileExt = mimeType.split('/')[1] || 'jpg';
        const fileName = `${uuid.v4()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        avatarUrl = await uploadToSupabaseManually(blob, filePath, mimeType);
      }

      const { error } = await supabase
        .from('Players')
        .update({
          first_name: params.firstName,
          surname: params.surname,
          nickname: params.nickname,
          dob: params.dob
            ? (() => {
                const d = new Date(params.dob);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                return `${y}-${m}-${day}`;
              })()
            : null,
          avatar_url: avatarUrl,
        })
        .eq('auth_id', user.id);

      if (error) {
        Alert.alert('Update Failed', error.message);
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'profile-creation5' }],
        });
        Toast.show({
          type: 'success',
          text1: 'Profile Created',
          text2: 'Your profile has been successfully created.',
          props: {
            colorScheme: colorScheme,
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 4',
        }}
      />
      <View className="flex-1 gap-3 bg-bg-grouped-1">
        <StepPillGroup steps={4} currentStep={4} />
        <View className="bg-bg-grouped-1 p-4">
          <Text
            style={{ lineHeight: 65 }}
            className="mb-4 font-delagothic text-6xl font-bold text-text-1">
            Why not add a photo?
          </Text>
          <Text className="mb-6 text-2xl text-text-2">
            So that your teammates and opponents can identify you.
          </Text>
        </View>
        <View className="w-full flex-1 items-center justify-around p-5">
          <Pressable onPress={pickImage}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="mb-4 h-60 w-60 rounded-2xl border-2"
                resizeMode="cover"
              />
            ) : (
              <View className="mb-4 h-52 w-52 items-center justify-center rounded-2xl border-2 border-border-color bg-background-light">
                <IonIcon name="camera-outline" size={50} color="#888" className="mb-2" />
                <Text className="text-center text-xl text-text-1">Tap to upload photo</Text>
              </View>
            )}
          </Pressable>
          <View className="mt-5 w-full items-center gap-5">
            <View className="w-full">
              <CTAButton
                type="info"
                text={imageUri ? 'Change Profile Photo' : 'Upload Profile Photo'}
                callbackFn={pickImage}
                disabled={uploading}
              />
            </View>
            <View className="w-full">
              <CTAButton
                type="success"
                text="Save Profile"
                callbackFn={handleSaveProfile}
                disabled={uploading}
              />
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation4;

const styles = StyleSheet.create({});
