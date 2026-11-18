import React, { useState } from 'react';
import { Dimensions, Image, Modal, Pressable, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardSafe';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { User, Mail, Lock, ChevronDown, Check, Camera, ChevronLeft, GraduationCap } from 'lucide-react-native';
import { Display, H2, Body, BodyMedium, Caption } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { PrimaryButton } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { Drift } from '@/components/ui/Drift';
import { useToast } from '@/components/ui/Toast';
import { courses, semesters } from '@/lib/mock-data';
import { colors } from '@/lib/theme';
import { signup } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { uploadAvatarForSignup } from '@/lib/api/uploads';

type Role = 'Student' | 'Teacher' | 'Alumni';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.3;

function SectionLabel({ children }: { children: string }) {
  return (
    <View className="flex-row items-center mb-3 mt-1">
      <View className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
      <Caption className="uppercase tracking-wide text-primary font-poppins-semibold">{children}</Caption>
    </View>
  );
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState<number | null>(null);
  const [role, setRole] = useState<Role>('Student');
  const [signupCode, setSignupCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const toast = useToast();

  const canSubmit = !!(name && email && password && course && semester && signupCode.trim() && agreed) && !submitting;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast('Photo library access was denied', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoAsset(result.assets[0]);
    }
  };

  const handleCreateAccount = async () => {
    if (!semester) return;
    setSubmitting(true);
    try {
      const result = await signup({
        fullName: name.trim(),
        email: email.trim(),
        password,
        course,
        semester,
        role,
        agreedToTerms: agreed,
        signupCode: signupCode.trim(),
      });

      // Photo is optional — never let an upload hiccup block account creation itself.
      if (photoAsset) {
        try {
          await uploadAvatarForSignup(result.avatarUploadToken, photoAsset);
        } catch (err) {
          const message = err instanceof ApiRequestError ? err.message : 'Could not upload your photo';
          toast(`Account created, but ${message.toLowerCase()} — you can add one later`, 'info');
        }
      }

      router.push({ pathname: '/(auth)/otp', params: { userId: result.userId, email: email.trim() } });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.';
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ink">
      {/* `overflow: hidden` keeps the ambient blobs clipped to the dark hero band. */}
      <View className="px-screen" style={{ height: HERO_HEIGHT, position: 'relative', overflow: 'hidden' }}>
        <GradientBlob />

        <AnimatedPressable
          haptics="tap"
          onPress={goBack}
          className="w-11 h-11 rounded-full bg-white/15 items-center justify-center mt-1"
        >
          <ChevronLeft size={22} color="#fff" />
        </AnimatedPressable>

        {/* Decorative "join campus" badge, distinct from Login's floating-avatar motif. Reveal owns
            the absolute positioning so the spring transform doesn't fight the layout. */}
        <Reveal index={0} spring scaleIn style={{ position: 'absolute', top: 10, right: 24 }}>
          <Drift range={10} duration={4800}>
            <View style={{ width: 68, height: 68, borderRadius: 34 }} className="bg-card-mint items-center justify-center">
              <GraduationCap size={30} color={colors.ink} />
            </View>
          </Drift>
        </Reveal>
        <Reveal index={1} spring scaleIn style={{ position: 'absolute', top: 86, right: 90 }}>
          <Drift range={7} duration={5600}>
            <View style={{ width: 10, height: 10, borderRadius: 5 }} className="bg-card-butter" />
          </Drift>
        </Reveal>
        <Reveal index={2} spring scaleIn style={{ position: 'absolute', top: 18, right: 100 }}>
          <Drift range={8} duration={4300}>
            <View style={{ width: 8, height: 8, borderRadius: 4 }} className="bg-primary opacity-60" />
          </Drift>
        </Reveal>
        <Reveal index={3} spring scaleIn style={{ position: 'absolute', top: 110, right: 50 }}>
          <Drift range={6} duration={5100}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5 }} className="bg-card-sky" />
          </Drift>
        </Reveal>

        <Reveal index={1} className="flex-1 justify-end pb-8">
          <Display className="text-white">Create your{'\n'}campus account</Display>
        </Reveal>
      </View>

      {/* `KeyboardAwareScrollView` is a third-party component, not one NativeWind patches to
          understand `className` — the rounded white sheet's background/shape styling lives on
          this plain wrapping `View` instead, where `className` is guaranteed to work. */}
      <View className="flex-1 bg-white dark:bg-surface-dark rounded-t-[32px] -mt-8">
        <KeyboardAwareScrollView style={{ flex: 1 }} bottomOffset={20} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="px-screen pt-8 pb-10">
            <Reveal index={2} spring scaleIn className="items-center mb-6">
              <AnimatedPressable haptics="tap" onPress={pickPhoto} scaleTo={0.96}>
                <View
                  className="w-24 h-24 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center overflow-hidden border-2 border-white dark:border-surface-dark"
                  style={{ elevation: 2 }}
                >
                  {photoAsset ? (
                    <Image source={{ uri: photoAsset.uri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <User size={34} color={colors.primary} />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ink items-center justify-center border-2 border-white dark:border-surface-dark">
                  <Camera size={15} color="#fff" />
                </View>
              </AnimatedPressable>
              <Caption className="mt-2">{photoAsset ? 'Tap to change photo' : 'Add a profile photo (optional)'}</Caption>
            </Reveal>

            <Reveal index={3}>
            <SectionLabel>Basic info</SectionLabel>
            <Input
              label="Full name"
              placeholder="Your name"
              leftIcon={<User size={20} color={colors.textSecondary} />}
              value={name}
              onChangeText={setName}
              className="mb-4"
            />
            <Input
              label="Email"
              placeholder="you@college.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
              value={email}
              onChangeText={setEmail}
              className="mb-4"
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secure
              leftIcon={<Lock size={20} color={colors.textSecondary} />}
              value={password}
              onChangeText={setPassword}
            />
            </Reveal>

            <View className="h-px bg-border-light dark:bg-border-dark my-6" />

            <Reveal index={4}>
            <SectionLabel>Academic details</SectionLabel>
            <Caption className="mb-2">Course</Caption>
            <AnimatedPressable
              haptics="tap"
              onPress={() => setCourseOpen(true)}
              className="flex-row items-center justify-between rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-3.5 mb-4"
            >
              <Body className={course ? '' : 'text-text-secondary dark:text-text-secondary-dark'}>
                {course || 'Select your course'}
              </Body>
              <ChevronDown size={20} color={colors.textSecondary} />
            </AnimatedPressable>

            <Caption className="mb-2">Semester</Caption>
            <View className="flex-row flex-wrap">
              {semesters.map((s) => (
                <Chip key={s} label={String(s)} active={semester === s} onPress={() => setSemester(s)} className="mb-2" />
              ))}
            </View>
            </Reveal>

            <View className="h-px bg-border-light dark:bg-border-dark my-6" />

            <Reveal index={5}>
            <SectionLabel>Role & agreement</SectionLabel>
            <Caption className="mb-2">I am a</Caption>
            <View className="flex-row self-start bg-background dark:bg-background-dark border border-border-light dark:border-border-dark rounded-full p-1 mb-5">
              <AnimatedPressable
                haptics="select"
                scaleTo={0.96}
                onPress={() => setRole('Student')}
                className={`px-6 py-2 rounded-full ${role === 'Student' ? 'bg-ink' : ''}`}
              >
                <BodyMedium className={role === 'Student' ? 'text-white' : ''}>Student</BodyMedium>
              </AnimatedPressable>
              <AnimatedPressable
                haptics="select"
                scaleTo={0.96}
                onPress={() => setRole('Teacher')}
                className={`px-6 py-2 rounded-full ${role === 'Teacher' ? 'bg-ink' : ''}`}
              >
                <BodyMedium className={role === 'Teacher' ? 'text-white' : ''}>Teacher</BodyMedium>
              </AnimatedPressable>
              <AnimatedPressable
                haptics="select"
                scaleTo={0.96}
                onPress={() => setRole('Alumni')}
                className={`px-6 py-2 rounded-full ${role === 'Alumni' ? 'bg-ink' : ''}`}
              >
                <BodyMedium className={role === 'Alumni' ? 'text-white' : ''}>Alumni</BodyMedium>
              </AnimatedPressable>
            </View>

            <Input
              label="Signup Code"
              placeholder="e.g. 7F3K-9QXZ"
              autoCapitalize="characters"
              value={signupCode}
              onChangeText={setSignupCode}
              className="mb-2"
            />
            <Caption className="mb-5 text-text-secondary dark:text-text-secondary-dark">
              Get this from your college office or alumni coordinator — it confirms you&apos;re
              really a {role.toLowerCase()} here, so your account skips manual review.
            </Caption>

            <AnimatedPressable
              haptics="select"
              scaleTo={0.98}
              onPress={() => setAgreed((a) => !a)}
              className="flex-row items-start mb-6"
            >
              <View
                className={`w-5 h-5 rounded-md mr-3 mt-0.5 border items-center justify-center ${
                  agreed ? 'bg-primary border-primary' : 'border-border-light dark:border-border-dark'
                }`}
              >
                {agreed && <Check size={14} color="#fff" />}
              </View>
              <Body className="flex-1">
                I agree to the{' '}
                <RNText onPress={() => router.push('/(auth)/terms')} className="text-primary font-poppins-medium">
                  Terms &amp; Conditions
                </RNText>
              </Body>
            </AnimatedPressable>

            <PrimaryButton
              label={submitting ? 'Creating account…' : 'Create Account'}
              disabled={!canSubmit}
              onPress={handleCreateAccount}
              shine
            />

            <View className="flex-row justify-center mt-6">
              <Body>Already have an account? </Body>
              <Pressable onPress={goBack}>
                <BodyMedium className="text-primary">Log In</BodyMedium>
              </Pressable>
            </View>
            </Reveal>
          </View>
        </KeyboardAwareScrollView>
      </View>

      <Modal transparent animationType="slide" visible={courseOpen} onRequestClose={() => setCourseOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setCourseOpen(false)} />
        <View className="bg-white dark:bg-surface-dark rounded-t-[32px] px-screen pt-6 pb-10">
          <H2 className="mb-4">Select course</H2>
          {courses.map((c) => (
            <AnimatedPressable
              key={c}
              haptics="select"
              scaleTo={0.98}
              onPress={() => {
                setCourse(c);
                setCourseOpen(false);
              }}
              className="flex-row items-center justify-between py-3.5 border-b border-border-light dark:border-border-dark"
            >
              <Body className={c === course ? 'text-primary font-poppins-medium' : ''}>{c}</Body>
              {c === course && <Check size={18} color={colors.primary} />}
            </AnimatedPressable>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
