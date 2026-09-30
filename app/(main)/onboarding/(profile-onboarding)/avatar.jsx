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
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const params = useLocalSearchParams();

  const { uploadToSupabase, uploading } = useCompressAndUploadImage();

  const handleSaveProfile = async () => {
    if (saving || uploading) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const folderPath = `${user.id}/`;

    try {
      setSaving(true);
      let avatarUrl = null;

      if (useGooglePhoto && isGoogleUser) {
        // Use Google profile photo
        avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
      } else if (imageUri) {
        // Upload first, then tidy up: a failed upload must not cost the player a photo they had
        avatarUrl = await uploadToSupabase(imageUri, folderPath, 'avatars');

        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(folderPath, { limit: 100 });
        const stale = (existingFiles || []).filter((f) => !avatarUrl?.includes(f.name));
        if (stale.length) {
          await supabase.storage.from('avatars').remove(stale.map((f) => `${folderPath}${f.name}`));
        }
      }

      const dob = params.dob ? new Date(params.dob) : null;
      const dobString = dob
        ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
        : null;

      // One checked call: validates the details and moves the player on to the next step.
      const { error } = await supabase.rpc('complete_profile_onboarding', {
        p_first_name: params.firstName,
        p_surname: params.surname,
        p_nickname: params.nickname,
        p_gender: params.gender,
        p_dob: dobString,
        p_avatar_url: avatarUrl,
      });
      if (error) throw error;

      router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been successfully updated.',
        props: {
          colorScheme: colorScheme,
        },
      });
    } catch (err) {
      Alert.alert('Could not save your profile', err.message || 'Please try again.');
    } finally {
      setSaving(false);
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
                disabled={uploading || saving}
              />
            )}
            <CTAButton
              type="yellow"
              textColor="black"
              text={saving || uploading ? 'Saving...' : 'Save Profile'}
              callbackFn={handleSaveProfile}
              disabled={uploading || saving}
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default Avatar;

const styles = StyleSheet.create({});
