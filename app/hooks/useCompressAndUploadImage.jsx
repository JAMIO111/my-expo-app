// hooks/useUploadImage.js
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import supabase from '@/lib/supabaseClient';
import uuid from 'react-native-uuid';

const PROJECT_URL = 'https://ionhcfjampzewimsgsmr.supabase.co'; // Replace with your Supabase project URL

const useCompressAndUploadImage = () => {
  const [uploading, setUploading] = useState(false);

  const compressImage = async (uri) => {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 512 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
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

  const uploadToSupabase = async (uri, folderPath, bucket) => {
    setUploading(true);
    try {
      const compressedUri = await compressImage(uri);
      const { blob, mimeType } = await uriToBlob(compressedUri);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = mimeType.split('/')[1] || 'jpg';
      const fileName = `${uuid.v4()}.${fileExt}`;
      const filePath = `${folderPath}${fileName}`;

      const uploadUrl = `${PROJECT_URL}/storage/v1/object/${bucket}/${filePath}`;
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

      return `${PROJECT_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadToSupabase,
    uploading,
  };
};

export default useCompressAndUploadImage;
