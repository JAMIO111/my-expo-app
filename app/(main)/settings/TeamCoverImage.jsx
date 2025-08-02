import { StyleSheet, View, useColorScheme, Alert } from 'react-native';
import ImageUploader from '@components/ImageUploader';
import CTAButton from '@components/CTAButton';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

const TeamCoverImage = () => {
  const { client: supabase } = useSupabaseClient();
  console.log(supabase, 'Supabase Client in TeamCoverImage');
  const router = useRouter();
  const { currentRole } = useUser();
  const { colorScheme } = useColorScheme();
  const [imageUri, setImageUri] = useState(currentRole?.team?.cover_image_url || null);

  const { uploadToSupabase, uploading } = useCompressAndUploadImage();

  const handleSaveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    let coverImageUrl = null;
    const folderPath = `${currentRole?.team?.id}/`;

    try {
      if (imageUri) {
        // Delete old files
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('team-cover-images')
          .list(folderPath, { limit: 100 });

        if (listError) throw new Error(`Failed to list old cover images: ${listError.message}`);

        if (existingFiles?.length) {
          const filePaths = existingFiles.map((f) => `${folderPath}${f.name}`);
          const { error: deleteError } = await supabase.storage
            .from('team-cover-images')
            .remove(filePaths);
          if (deleteError)
            throw new Error(`Failed to delete old cover images: ${deleteError.message}`);
        }

        // Upload new one via hook
        coverImageUrl = await uploadToSupabase(imageUri, folderPath, 'team-cover-images');
      }

      const { error } = await supabase
        .from('Teams')
        .update({
          cover_image_url: coverImageUrl,
        })
        .eq('id', currentRole?.team?.id);

      if (error) {
        Alert.alert('Update Failed', error.message);
      } else {
        router.back();
        Toast.show({
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your team cover photo has been successfully updated.',
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
    <View>
      <ImageUploader
        initialUri={imageUri || currentRole?.team?.cover_image_url}
        onImageChange={setImageUri}
        aspectRatio={[16, 12]}
        borderRadius={0}
        editable={true}
      />
      <View className="mt-5 w-full p-4">
        <CTAButton text="Save Cover Photo" callbackFn={handleSaveProfile} disabled={uploading} />
      </View>
    </View>
  );
};

export default TeamCoverImage;

const styles = StyleSheet.create({});
