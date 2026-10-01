import { View, Alert } from 'react-native';
import { supabase } from '@lib/supabase';
import { useState, useRef, useEffect } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import ImageUploader from '@components/ImageUploader';
import MenuContainer from '@components/MenuContainer';
import SettingsItem from '@components/SettingsItem';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';

const ManageCoverImagePage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const { teamId } = useLocalSearchParams();
  const { data: teamProfile, isLoading } = useTeamProfile(teamId);

  // The saved cover, as a stable baseline — never recomputed from local edits.
  const [originalCoverUrl, setOriginalCoverUrl] = useState(teamProfile?.cover_image_url || null);
  useEffect(() => {
    if (teamProfile?.cover_image_url !== undefined) {
      setOriginalCoverUrl(teamProfile.cover_image_url);
    }
  }, [teamProfile?.cover_image_url]);

  const [imageUri, setImageUri] = useState(teamProfile?.cover_image_url || null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const imageUploaderRef = useRef(null);

  const { uploadToSupabase, uploading } = useCompressAndUploadImage();

  const handleImageChange = (newUri, previousUri) => {
    if (newUri !== null) {
      // Picked/replaced an image — always a real pending change.
      setImageUri(newUri);
      setImageRemoved(false);
      return;
    }

    // newUri is null — something was removed. Was it the ORIGINAL saved
    // cover, or an unsaved new pick the user is backing out of?
    if (previousUri === originalCoverUrl) {
      // Explicit removal of the real saved cover.
      setImageUri(null);
      setImageRemoved(true);
    } else {
      // They cancelled a not-yet-saved new pick — revert to the saved
      // state, i.e. no pending change at all.
      setImageUri(originalCoverUrl);
      setImageRemoved(false);
      imageUploaderRef.current?.reset(originalCoverUrl);
    }
  };

  const handleSaveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const hasNewImage = imageUri && imageUri !== originalCoverUrl;
    if (!hasNewImage && !imageRemoved) {
      router.back();
      return;
    }

    const folderPath = `${teamId}/`;
    let newImagePath = null;

    try {
      setIsSaving(true);
      let coverImageUrl = null;

      if (hasNewImage) {
        coverImageUrl = await uploadToSupabase(imageUri, folderPath, 'team-cover-images');

        const marker = '/team-cover-images/';
        const markerIndex = coverImageUrl.indexOf(marker);
        newImagePath = markerIndex !== -1 ? coverImageUrl.slice(markerIndex + marker.length) : null;
      }

      const { error: updateError } = await supabase.rpc('update_team_cover_image', {
        p_team_id: teamId,
        p_cover_image_url: coverImageUrl,
      });

      if (updateError) {
        if (newImagePath) {
          await supabase.storage.from('team-cover-images').remove([newImagePath]);
        }
        throw new Error(updateError.message);
      }

      const { data: existingFiles, error: listError } = await supabase.storage
        .from('team-cover-images')
        .list(folderPath, { limit: 100 });

      if (!listError && existingFiles?.length) {
        const oldPaths = existingFiles
          .map((f) => `${folderPath}${f.name}`)
          .filter((path) => path !== newImagePath);

        if (oldPaths.length) {
          const { error: deleteError } = await supabase.storage
            .from('team-cover-images')
            .remove(oldPaths);
          if (deleteError) {
            console.warn('Failed to clean up old cover images:', deleteError.message);
          }
        }
      }

      await queryClient.invalidateQueries(['TeamProfile', teamId]);
      router.back();
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your team cover photo has been successfully updated.',
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasPendingChange = (imageUri && imageUri !== originalCoverUrl) || imageRemoved;

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Cover Image Editor" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 gap-5 p-3">
        <View style={{ borderRadius: 26 }} className="border border-theme-gray-3">
          <ImageUploader
            ref={imageUploaderRef}
            initialUri={originalCoverUrl}
            onImageChange={handleImageChange}
            aspectRatio={[16, 9]}
            borderRadius={24}
            editable={true}
          />
        </View>
        <MenuContainer>
          <SettingsItem
            icon="imagePlus"
            title="Change Cover Image"
            disabled={uploading || isSaving}
            callbackFn={() => imageUploaderRef.current?.openPicker()}
          />
          {hasPendingChange && (
            <SettingsItem
              icon="save"
              title={uploading || isSaving ? 'Saving...' : 'Save Cover Image'}
              disabled={uploading || isSaving}
              callbackFn={handleSaveProfile}
            />
          )}
        </MenuContainer>
      </View>
    </SafeViewWrapper>
  );
};

export default ManageCoverImagePage;
