import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, KeyRound, Check, Mail } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { PrimaryButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BodyMedium, Body, Caption, H2 } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { generateSignupCodes, listSignupCodes, type SignupCode, type SignupCodeRole } from '@/lib/api/admin';
import { ApiRequestError } from '@/lib/api/client';

const ROLES: SignupCodeRole[] = ['Student', 'Teacher', 'Alumni'];

export default function SignupCodesScreen() {
  const toast = useToast();
  const [role, setRole] = useState<SignupCodeRole>('Student');
  const [count, setCount] = useState('5');
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [justGenerated, setJustGenerated] = useState<SignupCode[]>([]);

  const [codes, setCodes] = useState<SignupCode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await listSignupCodes();
      setCodes(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load signup codes';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    const n = parseInt(count, 10);
    if (!n || n < 1 || n > 200 || generating) return;
    setGenerating(true);
    try {
      const created = await generateSignupCodes({ role, count: n, note: note.trim() || undefined });
      setJustGenerated(created);
      setCodes((list) => [...created, ...list]);
      toast(`${created.length} code${created.length > 1 ? 's' : ''} generated`);
      haptic.success();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not generate codes';
      toast(message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    haptic.select();
    toast('Copied');
  };

  const shareBatch = async () => {
    if (justGenerated.length === 0) return;
    const body = justGenerated.map((c) => c.code).join('\n');
    try {
      await Share.share({ message: `Campus Connect ${role} signup codes:\n\n${body}` });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  // Opens the device's email compose screen pre-filled with the code(s) — `mailto:` is the
  // portable, cross-platform way to do this (no extra dependency); it opens whatever the
  // device's default mail app is, which on most Android phones is Gmail.
  const emailCode = (c: SignupCode) => {
    const subject = encodeURIComponent(`Your Campus Connect ${c.role} signup code`);
    const body = encodeURIComponent(
      `Hi,\n\nHere's your signup code for Campus Connect (${c.role}):\n\n${c.code}\n\nOpen the app, go to Sign Up, pick "${c.role}", and enter this code when asked. It only works once.`
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() => {
      toast("Couldn't open an email app", 'error');
    });
  };

  const emailBatch = () => {
    if (justGenerated.length === 0) return;
    const subject = encodeURIComponent(`Campus Connect ${role} signup codes`);
    const body = encodeURIComponent(
      `Hi,\n\nHere ${justGenerated.length === 1 ? 'is' : 'are'} ${justGenerated.length} signup code${
        justGenerated.length === 1 ? '' : 's'
      } for ${role}:\n\n${justGenerated.map((c) => c.code).join('\n')}\n\nEach code only works once.`
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() => {
      toast("Couldn't open an email app", 'error');
    });
  };

  const unusedCount = codes.filter((c) => !c.used).length;

  return (
    <Screen>
      <Header title="Signup Codes" />

      <Card tone="lavender" className="mb-5">
        <BodyMedium className="mb-3">Generate codes</BodyMedium>

        <Caption className="mb-2">Role</Caption>
        <View className="flex-row flex-wrap mb-4">
          {ROLES.map((r) => (
            <AnimatedPressable
              key={r}
              haptics="select"
              scaleTo={0.96}
              onPress={() => setRole(r)}
              className={`px-4 py-2 rounded-full mr-2 mb-2 ${role === r ? 'bg-ink' : 'bg-white dark:bg-surface-dark'}`}
            >
              <BodyMedium className={role === r ? 'text-white' : ''}>{r}</BodyMedium>
            </AnimatedPressable>
          ))}
        </View>

        <Input
          label="How many codes?"
          placeholder="5"
          keyboardType="number-pad"
          value={count}
          onChangeText={setCount}
          className="mb-3"
        />
        <Input
          label="Note (optional)"
          placeholder="e.g. CS alumni batch 2024"
          value={note}
          onChangeText={setNote}
          className="mb-4"
        />

        <PrimaryButton label={generating ? 'Generating…' : 'Generate'} onPress={handleGenerate} disabled={generating} />
      </Card>

      {justGenerated.length > 0 && (
        <Reveal spring scaleIn className="mb-5">
          <Card tone="white">
            <View className="flex-row items-center justify-between mb-3">
              <BodyMedium>Just generated ({justGenerated.length})</BodyMedium>
              <View className="flex-row items-center">
                <AnimatedPressable haptics="select" onPress={emailBatch} className="mr-4">
                  <Caption className="text-primary font-poppins-semibold">Email all</Caption>
                </AnimatedPressable>
                <AnimatedPressable haptics="select" onPress={shareBatch}>
                  <Caption className="text-primary font-poppins-semibold">Share all</Caption>
                </AnimatedPressable>
              </View>
            </View>
            {justGenerated.map((c) => (
              <View key={c.id} className="flex-row items-center justify-between py-2 border-b border-border-light dark:border-border-dark">
                <Body className="font-poppins-semibold">{c.code}</Body>
                <View className="flex-row items-center">
                  <AnimatedPressable haptics="tap" onPress={() => emailCode(c)} className="mr-4">
                    <Mail size={18} color={colors.textSecondary} />
                  </AnimatedPressable>
                  <AnimatedPressable haptics="tap" onPress={() => copyCode(c.code)}>
                    <Copy size={18} color={colors.textSecondary} />
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </Card>
        </Reveal>
      )}

      <View className="flex-row items-center justify-between mb-3">
        <H2>All codes</H2>
        <Caption>{unusedCount} unused</Caption>
      </View>

      {loading ? (
        <>
          <Skeleton height={60} radius={16} className="mb-3" />
          <Skeleton height={60} radius={16} className="mb-3" />
        </>
      ) : codes.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={32} color={colors.primary} />}
          title="No codes yet"
          description="Generate some above to get started."
        />
      ) : (
        codes.map((c, i) => (
          <Reveal key={c.id} index={i} step={30}>
            <View className="flex-row items-center justify-between py-3 border-b border-border-light dark:border-border-dark">
              <View className="flex-1 pr-2">
                <View className="flex-row items-center">
                  <Body className="font-poppins-semibold mr-2">{c.code}</Body>
                  <Badge label={c.role} tone="primary" />
                </View>
                <Caption className="mt-1">
                  {c.used ? `Used by ${c.usedByName ?? 'someone'}` : c.note ?? 'Not used yet'}
                </Caption>
              </View>
              {c.used ? (
                <Check size={18} color={colors.success} />
              ) : (
                <View className="flex-row items-center">
                  <AnimatedPressable haptics="tap" onPress={() => emailCode(c)} className="mr-4">
                    <Mail size={18} color={colors.textSecondary} />
                  </AnimatedPressable>
                  <AnimatedPressable haptics="tap" onPress={() => copyCode(c.code)}>
                    <Copy size={18} color={colors.textSecondary} />
                  </AnimatedPressable>
                </View>
              )}
            </View>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
