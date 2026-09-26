import { StyleSheet, View, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import ImageUploader from '@components/ImageUploader';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useState, useRef, useEffect } from 'react';
import MenuContainer from '@components/MenuContainer';
import SettingsItem from '@components/SettingsItem';

const TeamCoverImage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentRole, refetch } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  // The saved cover, as a stable baseline — never recomputed from local edits.
  const [originalCoverUrl, setOriginalCoverUrl] = useState(
    currentRole?.team?.cover_image_url || null
  );
  useEffect(() => {
    if (currentRole?.team?.cover_image_url !== undefined) {
      setOriginalCoverUrl(currentRole.team.cover_image_url);
    }
  }, [currentRole?.team?.cover_image_url]);

  const [imageUri, setImageUri] = useState(currentRole?.team?.cover_image_url || null);
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

    const folderPath = `${currentRole?.team?.id}/`;
    let newImagePath = null;

    try {
      setIsSaving(true);
      let coverImageUrl = null;

      if (hasNewImage) {
        // Upload the NEW image first — nothing is deleted yet, so if this
        // fails, the team's existing cover image is untouched.
        coverImageUrl = await uploadToSupabase(imageUri, folderPath, 'team-cover-images');

        // Derive the relative storage path from the public URL, since
        // list()/remove() work in relative paths, not public URLs.
        const marker = '/team-cover-images/';
        const markerIndex = coverImageUrl.indexOf(marker);
        newImagePath = markerIndex !== -1 ? coverImageUrl.slice(markerIndex + marker.length) : null;
      }
      // else: coverImageUrl stays null — explicit removal

      const { error: updateError } = await supabase
        .from('Teams')
        .update({ cover_image_url: coverImageUrl })
        .eq('id', currentRole?.team?.id);

      if (updateError) {
        // DB update failed after a successful upload — remove the orphaned
        // new file so storage doesn't accumulate unreferenced images.
        if (newImagePath) {
          await supabase.storage.from('team-cover-images').remove([newImagePath]);
        }
        Alert.alert('Update Failed', updateError.message);
        return;
      }

      // Clean up the folder — covers both "replaced with new image" and
      // "explicitly removed" cases. Skipped entirely above if nothing changed.
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('team-cover-images')
        .list(folderPath, { limit: 100 });

      if (!listError && existingFiles?.length) {
        const oldPaths = existingFiles
          .map((f) => `${folderPath}${f.name}`)
          .filter((path) => path !== newImagePath); // don't delete the one we just uploaded

        if (oldPaths.length) {
          const { error: deleteError } = await supabase.storage
            .from('team-cover-images')
            .remove(oldPaths);
          if (deleteError) {
            console.warn('Failed to clean up old cover images:', deleteError.message);
          }
        }
      }
      await refetch();
      await queryClient.invalidateQueries(['TeamProfile', currentRole?.team?.id]);
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
              <CustomHeader title="Team Cover Image" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 gap-5 bg-bg-grouped-1 p-3">
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

export default TeamCoverImage;

const styles = StyleSheet.create({});
