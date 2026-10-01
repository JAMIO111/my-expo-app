import { StyleSheet, Text, View, Alert, useColorScheme, Image } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CTAButton from '@components/CTAButton';
import { useLocalSearchParams, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import ImageUploader from '@components/ImageUploader';
import { useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import { getSocialAvatar, downloadSocialAvatar } from '@lib/socialAvatar';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

const PROJECT_URL = 'https://ionhcfjampzewimsgsmr.supabase.co'; // Replace with your actual Supabase project URL

const Avatar = () => {
  useOnboardingStep(5, 5);
  const { user } = useUser();
  const social = getSocialAvatar(user);
  const [useSocialPhoto, setUseSocialPhoto] = useState(!!social);
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

      if (useSocialPhoto && social) {
        // Keep our own copy of the social photo: provider links can expire
        try {
          const local = await downloadSocialAvatar(social.url);
          avatarUrl = await uploadToSupabase(local, folderPath, 'avatars');
        } catch (e) {
          avatarUrl = social.url;
        }
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
<View className="flex-1 gap-3 bg-brand">
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
          {social && useSocialPhoto ? (
            <View className="overflow-hidden rounded-2xl bg-bg-grouped-2 p-1">
              <Image
                style={{ height: 248, width: 248 }}
                source={{ uri: social?.url }}
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
            {social && (
              <CTAButton
                type="white"
                textColor="black"
                text={useSocialPhoto ? 'Use Custom Photo' : `Use ${social.label} Photo`}
                callbackFn={() => setUseSocialPhoto(!useSocialPhoto)}
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
