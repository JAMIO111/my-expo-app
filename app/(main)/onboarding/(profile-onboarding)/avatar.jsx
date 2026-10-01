import { Text, View, Alert, useColorScheme, Image, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import ImageUploader from '@components/ImageUploader';
import { useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import { getSocialAvatar, downloadSocialAvatar } from '@lib/socialAvatar';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

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

  const hasPhoto = (social && useSocialPhoto) || !!imageUri;
  const busy = saving || uploading;
  const SIZE = 220;

  return (
    <OnboardingScreen
      title="Add a photo"
      subtitle="So your teammates and opponents can pick you out. You can change it any time."
      onCta={handleSaveProfile}
      ctaDisabled={busy}
      ctaLoading={busy}
      ctaText={hasPhoto ? 'Finish' : 'Skip for now'}>
      <View className="items-center gap-8">
        <Animated.View
          entering={FadeInDown.duration(380)}
          className="items-center justify-center rounded-full border-4 border-white/20 p-2">
          {social && useSocialPhoto ? (
            <Image
              style={{ height: SIZE, width: SIZE, borderRadius: SIZE / 2 }}
              source={{ uri: social.url }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ borderRadius: SIZE / 2, overflow: 'hidden' }}>
              <ImageUploader
                initialUri={imageUri}
                onImageChange={setImageUri}
                size={SIZE}
                aspectRatio={[1, 1]}
                borderRadius={SIZE / 2}
              />
            </View>
          )}
        </Animated.View>

        {social ? (
          <Animated.View entering={FadeInDown.delay(100).duration(380)} className="w-full">
            <Pressable
              disabled={busy}
              onPress={() => setUseSocialPhoto(!useSocialPhoto)}
              className="flex-row items-center justify-center gap-3 rounded-2xl border-2 border-white/20 bg-white/10 px-5 py-4">
              <Ionicons
                name={useSocialPhoto ? 'image-outline' : 'logo-google'}
                size={22}
                color="white"
              />
              <Text className="font-saira-semibold text-lg text-text-on-brand">
                {useSocialPhoto ? 'Choose my own photo' : `Use my ${social.label} photo`}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </OnboardingScreen>
  );
};

export default Avatar;
