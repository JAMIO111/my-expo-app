import { StyleSheet, Text, View, Alert, useColorScheme, Image } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CTAButton from '@components/CTAButton';
import { useLocalSearchParams, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import StepPillGroup from '@components/StepPillGroup';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import ImageUploader from '@components/ImageUploader';
import { useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';

const PROJECT_URL = 'https://ionhcfjampzewimsgsmr.supabase.co'; // Replace with your actual Supabase project URL

const Avatar = () => {
  const { user } = useUser();
  const isGoogleUser = user?.app_metadata?.provider === 'google';
  const [useGooglePhoto, setUseGooglePhoto] = useState(isGoogleUser);
  const { colorScheme } = useColorScheme();
  const [imageUri, setImageUri] = useState(null);
  const router = useRouter();

  const params = useLocalSearchParams();

  const { uploadToSupabase, uploading } = useCompressAndUploadImage();

  const handleSaveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    let avatarUrl = null;
    const folderPath = `${user.id}/`;

    try {
      if (useGooglePhoto && isGoogleUser) {
        // Use Google profile photo
        avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
      } else if (imageUri) {
        // Delete old files
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('avatars')
          .list(folderPath, { limit: 100 });

        if (listError) throw new Error(`Failed to list old avatars: ${listError.message}`);

        if (existingFiles?.length) {
          const filePaths = existingFiles.map((f) => `${folderPath}${f.name}`);
          const { error: deleteError } = await supabase.storage.from('avatars').remove(filePaths);
          if (deleteError) throw new Error(`Failed to delete old avatars: ${deleteError.message}`);
        }

        // Upload new one via hook
        avatarUrl = await uploadToSupabase(imageUri, folderPath, 'avatars');
      }

      const { error } = await supabase
        .from('Players')
        .update({
          first_name: params.firstName,
          surname: params.surname,
          nickname: params.nickname,
          gender: params.gender,
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
          onboarding: 1,
          claimed: true,
          claimed_at: new Date().toISOString(),
        })
        .eq('auth_id', user.id);

      if (error) {
        Alert.alert('Update Failed', error.message);
      } else {
        router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your profile has been successfully updated.',
          props: {
            colorScheme: colorScheme,
          },
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 5 of 5',
        }}
      />
      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={5} currentStep={5} />
        <View className="p-4">
          <Text
            style={{ lineHeight: 50 }}
            className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">
            Why not add a photo?
          </Text>
          <Text className="text-2xl text-text-on-brand-2">
            So that your teammates and opponents can identify you.
          </Text>
        </View>
        <View className="w-full flex-1 items-center justify-around p-5">
          {isGoogleUser && useGooglePhoto ? (
            <View className="overflow-hidden rounded-2xl bg-bg-grouped-2 p-1">
              <Image
                style={{ height: 248, width: 248 }}
                source={{ uri: user?.user_metadata?.avatar_url }}
                className="rounded-2xl"
                resizeMode="cover"
              />
            </View>
          ) : (
            <ImageUploader
              initialUri={imageUri}
              onImageChange={setImageUri}
              size={250}
              aspectRatio={[1, 1]}
            />
          )}
          <View className="mt-5 w-full gap-5">
            {isGoogleUser && (
              <CTAButton
                type="white"
                textColor="black"
                text={useGooglePhoto ? 'Use Custom Photo' : 'Use Google Photo'}
                callbackFn={() => setUseGooglePhoto(!useGooglePhoto)}
                disabled={uploading}
              />
            )}
            <CTAButton
              type="yellow"
              textColor="black"
              text="Save Profile"
              callbackFn={handleSaveProfile}
              disabled={uploading}
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default Avatar;

const styles = StyleSheet.create({});
