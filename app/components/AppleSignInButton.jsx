import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';

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

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }

      // ✅ Exchange the Apple identity token for a Supabase session
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      // ✅ Apple only gives you fullName on the FIRST authorization ever.
      // If present, push it onto the Players row now — you won't get it again.
      if (credential.fullName?.givenName || credential.fullName?.familyName) {
        const fullName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ');

        const { error: profileError } = await supabase
          .from('Players')
          .update({ name: fullName })
          .eq('auth_id', data.user.id);

        if (profileError) {
          console.error('[Apple] Failed to save name from first sign-in:', profileError);
        }
      }

      // No need to manually navigate or call Purchases.logIn here —
      // UserProvider's onAuthStateChange listener handles both automatically.
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
