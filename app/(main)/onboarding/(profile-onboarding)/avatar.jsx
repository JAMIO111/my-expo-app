import { StyleSheet, Text, View, Alert, useColorScheme } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CTAButton from '@components/CTAButton';
import { useLocalSearchParams, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import StepPillGroup from '@components/StepPillGroup';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import ImageUploader from '@components/ImageUploader';
import { useRouter } from 'expo-router';

const PROJECT_URL = 'https://ionhcfjampzewimsgsmr.supabase.co'; // Replace with your actual Supabase project URL

const Avatar = () => {
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
      if (imageUri) {
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
          title: 'Step 4 of 4',
        }}
      />
      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={4} currentStep={4} />
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
          <ImageUploader
            initialUri={imageUri}
            onImageChange={setImageUri}
            size={250}
            aspectRatio={[1, 1]}
          />
          <View className="mt-5 w-full">
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
