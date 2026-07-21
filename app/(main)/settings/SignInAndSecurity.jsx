import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CTAButton from '@components/CTAButton';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import CustomHeader from '@components/CustomHeader';
import Purchases from 'react-native-purchases';
import IonIcons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// ─── Password strength helper ─────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
  if (score <= 2) return { label: 'Fair', color: '#f97316', width: '50%' };
  if (score <= 3) return { label: 'Good', color: '#eab308', width: '75%' };
  return { label: 'Strong', color: '#22c55e', width: '100%' };
};

// ─── Secure input ─────────────────────────────────────────
const PasswordInput = ({ placeholder, value, onChangeText, hasError }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.inputWrap, hasError && styles.inputWrapError]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={!visible}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
      />
      <Pressable onPress={() => setVisible((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
        <IonIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
      </Pressable>
    </View>
  );
};

// ─── Provider config ──────────────────────────────────────
const PROVIDERS = [
  {
    key: 'email',
    label: 'Email',
    icon: 'mail-outline',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    canUnlink: false, // email is the base identity
  },
  {
    key: 'google',
    label: 'Google',
    icon: 'logo-google',
    color: '#ea4335',
    bgColor: '#fef2f2',
    canUnlink: true,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877f2',
    bgColor: '#eff6ff',
    canUnlink: true,
  },
];

// ─── Connected Logins Section ─────────────────────────────
const ConnectedLoginsSection = ({ user, onIdentitiesChange }) => {
  const [identities, setIdentities] = useState(user?.identities ?? []);
  const [loadingKey, setLoadingKey] = useState(null);
  const [confirmUnlink, setConfirmUnlink] = useState(null);

  useEffect(() => {
    setIdentities(user?.identities ?? []);
  }, [user]);

  const isConnected = (providerKey) => identities.some((i) => i.provider === providerKey);

  const handleLink = async (providerKey) => {
    setLoadingKey(providerKey);

    try {
      const redirectTo = makeRedirectUri({
        scheme: 'breakroom',
        path: 'auth',
        useProxy: false,
      });

      const { data, error } = await supabase.auth.linkIdentity({
        provider: providerKey,
        options: {
          redirectTo,
        },
      });

      if (error) throw error;

      console.log('LinkIdentity response:', data);

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        console.log('OAuth result:', result);

        if (result.type === 'success') {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          console.log('Identities:', user.identities);

          setIdentities(user.identities);
          onIdentitiesChange?.(user.identities);

          Toast.show({
            type: 'success',
            text1: `${providerKey} linked successfully`,
          });
        }
      }
    } catch (err) {
      console.error(err);

      Toast.show({
        type: 'error',
        text1: 'Failed to link account',
        text2: err.message,
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const handleUnlink = async (providerKey) => {
    setLoadingKey(providerKey);
    setConfirmUnlink(null);
    try {
      const identity = identities.find((i) => i.provider === providerKey);
      if (!identity) throw new Error('Identity not found');

      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;

      const updated = identities.filter((i) => i.provider !== providerKey);
      setIdentities(updated);
      onIdentitiesChange?.(updated);

      Toast.show({ type: 'success', text1: `${providerKey} unlinked` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to unlink account', text2: err.message });
    } finally {
      setLoadingKey(null);
    }
  };

  const linkedCount = identities.length;

  return (
    <>
      <Text style={styles.sectionLabel}>CONNECTED LOGINS</Text>
      <View style={styles.providerList}>
        {PROVIDERS.map((provider, index) => {
          const connected = isConnected(provider.key);
          const isLoading = loadingKey === provider.key;
          const isLast = index === PROVIDERS.length - 1;
          // Prevent unlinking if it's the only identity
          const canUnlink = provider.canUnlink && linkedCount > 1;

          return (
            <View key={provider.key}>
              <View style={[styles.providerRow, isLast && { borderBottomWidth: 0 }]}>
                {/* Icon */}
                <View style={[styles.providerIconWrap, { backgroundColor: provider.bgColor }]}>
                  <IonIcons name={provider.icon} size={20} color={provider.color} />
                </View>

                {/* Label + status */}
                <View style={styles.providerInfo}>
                  <Text style={styles.providerLabel}>{provider.label}</Text>
                  <Text
                    style={[styles.providerStatus, { color: connected ? '#22c55e' : '#9ca3af' }]}>
                    {connected ? 'Connected' : 'Not connected'}
                  </Text>
                </View>

                {/* Action */}
                {isLoading ? (
                  <ActivityIndicator size="small" color="#6b7280" />
                ) : provider.key === 'email' ? (
                  <View
                    style={[
                      styles.providerBadge,
                      { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
                    ]}>
                    <Text style={[styles.providerBadgeText, { color: '#16a34a' }]}>Primary</Text>
                  </View>
                ) : connected ? (
                  <Pressable
                    onPress={() => (canUnlink ? setConfirmUnlink(provider) : null)}
                    style={({ pressed }) => [
                      styles.providerBadge,
                      {
                        backgroundColor: canUnlink ? '#fef2f2' : '#f9fafb',
                        borderColor: canUnlink ? '#fecaca' : '#e5e7eb',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.providerBadgeText,
                        { color: canUnlink ? '#ef4444' : '#9ca3af' },
                      ]}>
                      {canUnlink ? 'Unlink' : 'Linked'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleLink(provider.key)}
                    style={({ pressed }) => [
                      styles.providerBadge,
                      {
                        backgroundColor: '#f0f9ff',
                        borderColor: '#bae6fd',
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}>
                    <Text style={[styles.providerBadgeText, { color: '#0284c7' }]}>Link</Text>
                  </Pressable>
                )}
              </View>
              {!isLast && <View style={styles.providerDivider} />}
            </View>
          );
        })}
      </View>

      {/* Unlink confirmation */}
      <FloatingBottomSheet
        visible={!!confirmUnlink}
        title={`Unlink ${confirmUnlink?.label}?`}
        message={`You will no longer be able to sign in with ${confirmUnlink?.label}. Make sure you have another login method available.`}
        topButtonText="Unlink"
        bottomButtonText="Cancel"
        topButtonType="error"
        bottomButtonType="default"
        topButtonFn={() => handleUnlink(confirmUnlink?.key)}
        bottomButtonFn={() => setConfirmUnlink(null)}
        onCancel={() => setConfirmUnlink(null)}
      />
    </>
  );
};

// ─── Main page ────────────────────────────────────────────
const SignInAndSecurity = () => {
  const { user, player } = useUser();
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const panelHeight = useRef(new Animated.Value(0)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;

  const openPanel = () => {
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    Animated.parallel([
      Animated.spring(panelHeight, {
        toValue: 1,
        useNativeDriver: false,
        damping: 18,
        stiffness: 120,
      }),
      Animated.timing(panelOpacity, { toValue: 1, duration: 220, useNativeDriver: false }),
    ]).start();
  };

  const closePanel = () => {
    Animated.parallel([
      Animated.timing(panelHeight, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(panelOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    });
  };

  const strength = getPasswordStrength(newPassword);
  const provider = user?.identities?.[0]?.provider ?? 'email';
  const isOAuthUser = provider !== 'email';
  const providerLabel = `${provider.slice(0, 1).toUpperCase()}${provider.slice(1)}`;

  const waitForAuthSettle = () =>
    new Promise((resolve) => {
      const { data: listener } = supabase.auth.onAuthStateChange(() => {
        listener.subscription.unsubscribe();
        resolve();
      });
    });

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!currentPassword) return setPasswordError('Please enter your current password.');
    if (newPassword.length < 8)
      return setPasswordError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setPasswordError("New passwords don't match.");
    if (newPassword === currentPassword)
      return setPasswordError('New password must be different from your current password.');

    setIsSaving(true);
    try {
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reAuthError) {
        setPasswordError('Current password is incorrect.');
        return;
      }
      await waitForAuthSettle();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }
      setPasswordSuccess(true);
      setTimeout(() => closePanel(), 1800);
    } catch (err) {
      setPasswordError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const animatedMaxHeight = panelHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 420] });

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Sign-In & Security" />
            </SafeViewWrapper>
          ),
        }}
      />

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={40}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        {/* ── Connected logins ── */}
        <ConnectedLoginsSection user={user} />

        {/* ── Account info ── */}
        <Text style={styles.sectionLabel}>ACCOUNT INFO</Text>
        <MenuContainer>
          <SettingsItem disabled title="Email" text={user?.email} />
          <SettingsItem disabled title="Auth ID" text={user?.id} />
          <SettingsItem disabled lastItem title="Player ID" text={player?.id} />
        </MenuContainer>

        {/* ── Password ── */}
        {!isOAuthUser && (
          <>
            <Text style={styles.sectionLabel}>PASSWORD</Text>
            <View style={styles.passwordSection}>
              <Pressable
                style={styles.passwordHeader}
                onPress={isChangingPassword ? closePanel : openPanel}>
                <View>
                  <Text style={styles.passwordTitle}>Change Password</Text>
                  <Text style={styles.passwordSubtitle}>
                    {isChangingPassword ? 'Tap to cancel' : 'Update your account password'}
                  </Text>
                </View>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: panelHeight.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                  }}>
                  <IonIcons name="chevron-down" size={20} color="#6b7280" />
                </Animated.View>
              </Pressable>

              <Animated.View
                style={{ maxHeight: animatedMaxHeight, opacity: panelOpacity, overflow: 'hidden' }}>
                <View style={styles.passwordForm}>
                  {passwordSuccess ? (
                    <View style={styles.successBanner}>
                      <IonIcons name="checkmark-circle" size={20} color="#22c55e" />
                      <Text style={styles.successText}>Password updated successfully!</Text>
                    </View>
                  ) : (
                    <>
                      <PasswordInput
                        placeholder="Current password"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        hasError={!!passwordError && !currentPassword}
                      />
                      <View style={{ gap: 6 }}>
                        <PasswordInput
                          placeholder="New password"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          hasError={!!passwordError && newPassword.length < 8}
                        />
                        {newPassword.length > 0 && strength && (
                          <View style={styles.strengthRow}>
                            <View style={styles.strengthTrack}>
                              <View
                                style={[
                                  styles.strengthFill,
                                  { width: strength.width, backgroundColor: strength.color },
                                ]}
                              />
                            </View>
                            <Text style={[styles.strengthLabel, { color: strength.color }]}>
                              {strength.label}
                            </Text>
                          </View>
                        )}
                      </View>
                      <PasswordInput
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        hasError={
                          !!passwordError &&
                          confirmPassword.length > 0 &&
                          confirmPassword !== newPassword
                        }
                      />
                      {passwordError && (
                        <View style={styles.errorBanner}>
                          <IonIcons name="alert-circle-outline" size={16} color="#ef4444" />
                          <Text style={styles.errorText}>{passwordError}</Text>
                        </View>
                      )}
                      <CTAButton
                        text={isSaving ? 'Updating...' : 'Update Password'}
                        type="yellow"
                        textColor="black"
                        callbackFn={handleChangePassword}
                        disabled={isSaving}
                      />
                    </>
                  )}
                </View>
              </Animated.View>
            </View>
          </>
        )}

        {isOAuthUser && (
          <>
            <Text style={styles.sectionLabel}>PASSWORD</Text>
            <View style={styles.oauthNotice}>
              <IonIcons name="information-circle-outline" size={18} color="#6b7280" />
              <Text style={styles.oauthNoticeText}>
                You signed in with {providerLabel}. Password management is handled by your{' '}
                {providerLabel} account.
              </Text>
            </View>
          </>
        )}

        {/* ── Danger zone ── */}
        <View className="mt-8 rounded-3xl border border-theme-red bg-bg-1 p-4 pb-2">
          <Text style={[styles.sectionLabel, { color: '#ef4444', marginTop: 8 }]}>DANGER ZONE</Text>
          <View style={styles.dangerSection}>
            <Text className="mb-2 px-1 pt-4 font-saira-medium text-text-1">
              Time to hang up the cue?
            </Text>
            <Text className="mb-2 px-1 py-2 font-saira-medium text-sm text-text-2">
              Delete your account and all associated data. This action is permanent and cannot be
              undone.
            </Text>
            <CTAButton
              text="Delete Account"
              type="error"
              callbackFn={() => setDeleteAccountModal(true)}
              loading={isDeleting}
              loadingText={isDeleting ? 'Deleting...' : undefined}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <FloatingBottomSheet
        visible={deleteAccountModal}
        title="Are you sure you want to delete your account?"
        message="You will lose access to your account and all of your stats and history will be permanently deleted."
        topButtonText="Cancel"
        bottomButtonText={isDeleting ? 'Deleting…' : 'Delete Account'}
        topButtonType="default"
        bottomButtonType="error"
        topButtonFn={() => setDeleteAccountModal(false)}
        bottomButtonFn={async () => {
          setIsDeleting(true);
          try {
            const { data, error } = await supabase.rpc('delete_user_account');
            if (error) throw error;
            if (data?.photo_path) await supabase.storage.from('avatars').remove([data.photo_path]);
            const isAnonymous = await Purchases.isAnonymous();
            if (!isAnonymous) await Purchases.logOut();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const res = await fetch(
              `https://ionhcfjampzewimsgsmr.supabase.co/functions/v1/delete-auth-user`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            if (!res.ok) throw new Error('Failed to delete account');
            await supabase.auth.signOut();
            setDeleteAccountModal(false);
            Toast.show({ type: 'success', text1: 'Account deleted successfully.' });
          } catch (err) {
            setDeleteAccountModal(false);
            Toast.show({ type: 'error', text1: 'Could not delete account. Please try again.' });
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => setDeleteAccountModal(false)}
      />
    </SafeViewWrapper>
  );
};

export default SignInAndSecurity;

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  // ── Provider list ──
  providerList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },

  providerDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },

  providerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  providerInfo: {
    flex: 1,
    gap: 2,
  },

  providerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  providerStatus: {
    fontSize: 12,
  },

  providerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  providerBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Password section ──
  passwordSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },

  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  passwordTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  passwordSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  passwordForm: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
  },

  inputWrapError: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  eyeBtn: { paddingLeft: 8 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strengthTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 4 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 44, textAlign: 'right' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorText: { fontSize: 13, color: '#ef4444', flex: 1 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  successText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },

  oauthNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  oauthNoticeText: { fontSize: 13, color: '#6b7280', flex: 1, lineHeight: 20 },

  dangerSection: { marginBottom: 8 },
});
