import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function AppleSignInButton() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  if (!isAvailable) {
    return null;
  }

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential:', credential);
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return;
      }

      console.error('Apple Sign-In error:', error);

      Alert.alert('Sign in failed', 'Unable to sign in with Apple. Please try again.');
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={{
        width: '100%',
        height: 50,
      }}
      onPress={handleAppleSignIn}
    />
  );
}
