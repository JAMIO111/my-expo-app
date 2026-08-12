import { StyleSheet, View, useColorScheme, Alert } from 'react-native';
import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import ImageUploader from '@components/ImageUploader';
import CTAButton from '@components/CTAButton';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useState, useRef } from 'react';

const TeamCoverImage = () => {
  console.log(supabase, 'Supabase Client in TeamCoverImage');
  const router = useRouter();
  const { currentRole } = useUser();
  const { colorScheme } = useColorScheme();
  const [imageUri, setImageUri] = useState(currentRole?.team?.cover_image_url || null);
  const imageUploaderRef = useRef(null);

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
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Crest Editor" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16">
        <View className="bg-brand-light p-2 py-4">
          <ImageUploader
            ref={imageUploaderRef}
            initialUri={imageUri || currentRole?.team?.cover_image_url}
            onImageChange={setImageUri}
            aspectRatio={[16, 9]}
            borderRadius={24}
            editable={true}
          />
        </View>
        <View className="mt-5 w-full gap-5 p-4">
          <CTAButton
            type="yellow"
            text="Change Cover Photo"
            callbackFn={() => imageUploaderRef.current?.openPicker()}
            disabled={uploading}
          />

          <CTAButton
            type="success"
            text="Save Cover Photo"
            callbackFn={handleSaveProfile}
            disabled={uploading}
          />
        </View>
      </View>
    </SafeViewWrapper>
  );
};

export default TeamCoverImage;

const styles = StyleSheet.create({});
