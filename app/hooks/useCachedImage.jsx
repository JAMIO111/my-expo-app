import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';

const getFileNameFromUrl = (url) => {
  return url?.split('/').pop()?.split('?')[0] || `fallback-${Date.now()}`;
};

const useCachedImage = (remoteUrl) => {
  const [localUri, setLocalUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!remoteUrl) return;

    let isCancelled = false;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        const fileName = getFileNameFromUrl(remoteUrl);
        const fileUri = `${FileSystem.cacheDirectory}-${fileName}`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          if (!isCancelled) setLocalUri(fileInfo.uri);
        } else {
          const download = await FileSystem.downloadAsync(remoteUrl, fileUri);
          if (!isCancelled) setLocalUri(download.uri);
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Image cache error:', err);
          setError(err);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
    };
  }, [remoteUrl]);

  return { localUri, loading, error };
};

export default useCachedImage;
