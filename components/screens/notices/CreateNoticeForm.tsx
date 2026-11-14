import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  Info,
  Italic,
  Layers,
  Link2,
  PartyPopper,
  Underline,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Body, BodyMedium, Caption, H2 } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { courses, semesters } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { createNotice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';

type CategoryMeta = { icon: typeof AlertTriangle; tone: 'danger' | 'lavender' | 'mint' | 'butter' };

const CATEGORY_META: Record<NoticeCategory, CategoryMeta> = {
  Urgent: { icon: AlertTriangle, tone: 'danger' },
  Exam: { icon: BookOpen, tone: 'lavender' },
  Event: { icon: PartyPopper, tone: 'mint' },
  General: { icon: Info, tone: 'butter' },
};

const TONE_BG: Record<CategoryMeta['tone'], string> = {
  danger: 'bg-danger',
  lavender: 'bg-card-lavender dark:bg-card-lavender-dark',
  mint: 'bg-card-mint dark:bg-card-mint-dark',
  butter: 'bg-card-butter dark:bg-card-butter-dark',
};

function CategoryChip({
  category,
  active,
  onPress,
}: {
  category: NoticeCategory;
  active: boolean;
  onPress: () => void;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const isDanger = meta.tone === 'danger';

  return (
    <AnimatedPressable
      haptics="select"
      onPress={onPress}
      className={`flex-row items-center rounded-full pl-1.5 pr-4 py-1.5 mr-2 mb-2 border ${
        active && isDanger
          ? 'bg-danger border-danger'
          : active
          ? 'bg-ink border-ink'
          : 'bg-white dark:bg-surface-dark border-border-light dark:border-border-dark'
      }`}
    >
      <View
        className={`w-7 h-7 rounded-full items-center justify-center mr-2 ${
          active ? 'bg-white/25' : TONE_BG[meta.tone]
        }`}
      >
        <Icon size={14} color={active ? '#fff' : isDanger ? colors.danger : colors.ink} />
      </View>
      <BodyMedium className={active ? 'text-white' : ''}>{category}</BodyMedium>
    </AnimatedPressable>
  );
}

function PickerField({
  placeholder,
  value,
  options,
  onSelect,
}: {
  placeholder: string;
  value: string | null;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AnimatedPressable
        haptics="tap"
        onPress={() => setOpen(true)}
        className="flex-1 flex-row items-center justify-between rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-3.5"
      >
        <Body className={value ? '' : 'text-text-secondary dark:text-text-secondary-dark'}>
          {value ?? placeholder}
        </Body>
        <ChevronDown size={18} color={colors.textSecondary} />
      </AnimatedPressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-center px-8" onPress={() => setOpen(false)}>
          <Pressable className="bg-white dark:bg-surface-dark rounded-card max-h-96 overflow-hidden">
            {options.map((opt) => (
              <AnimatedPressable
                key={opt}
                haptics="select"
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
                className="px-5 py-3.5 border-b border-border-light dark:border-border-dark"
              >
                <Body>{opt}</Body>
              </AnimatedPressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function ToolbarIcon({ label, bold }: { label: string; bold?: boolean }) {
  return (
    <View className="w-6 h-6 items-center justify-center">
      <Body className={bold ? 'font-poppins-bold' : ''} style={{ color: colors.textSecondary, fontSize: 14 }}>
        {label}
      </Body>
    </View>
  );
}

/** Shared by the Teacher and Admin "Create Notice" screens — both roles hit the same real
 *  `createNotice` endpoint (the backend allows Admin or Teacher), so only the header's role
 *  label actually differs between them. */
export function CreateNoticeForm({ roleLabel }: { roleLabel: string }) {
  const toast = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('Urgent');
  const [audience, setAudience] = useState<'all' | 'course'>('all');
  const [targetCourse, setTargetCourse] = useState<string | null>(null);
  const [targetSemester, setTargetSemester] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const saveDraft = () => {
    haptic.select();
    toast('Drafts aren’t saved yet — publish directly for now', 'info');
  };

  const publish = async () => {
    if (!title.trim() || !description.trim()) {
      haptic.error();
      toast('Add a title and description first', 'error');
      return;
    }
    if (publishing) return;
    setPublishing(true);
    try {
      await createNotice({
        title: title.trim(),
        body: description.trim(),
        category,
        targetCourse: audience === 'course' && targetCourse ? targetCourse : undefined,
        targetSemester: audience === 'course' && targetSemester ? Number(targetSemester) : undefined,
      });
      haptic.success();
      toast('Notice published');
      router.back();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not publish notice';
      haptic.error();
      toast(message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Screen scroll contentClassName="pb-28">
      <View className="flex-row items-center justify-between pt-4 pb-5">
        <IconButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ChevronLeft size={22} color={colors.ink} />
        </IconButton>
        <View className="flex-1 ml-3">
          <H2>Create Notice</H2>
          <Caption>
            {roleLabel} · {user?.fullName ?? ''}
          </Caption>
        </View>
        <SecondaryButton label="Save Draft" onPress={saveDraft} className="px-4 py-2" />
      </View>

      <Caption className="mb-2">Notice Title *</Caption>
      <Input
        placeholder="e.g. Mid-Semester Examination Schedule"
        value={title}
        onChangeText={setTitle}
        className="mb-5"
      />

      <Caption className="mb-2">Description *</Caption>
      <View className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-input overflow-hidden">
        <View className="flex-row items-center px-3 py-2.5 border-b border-border-light dark:border-border-dark">
          <ToolbarIcon label="B" bold />
          <Italic size={16} color={colors.textSecondary} style={{ marginHorizontal: 10 }} />
          <Underline size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <Layers size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <Link2 size={16} color={colors.textSecondary} />
        </View>
        <TextInput
          placeholder="Write the full notice here…"
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="font-poppins text-body text-text-primary dark:text-text-primary-dark px-4 py-3"
          style={{ minHeight: 110 }}
        />
      </View>

      <Caption className="mt-6 mb-2">Category</Caption>
      <View className="flex-row flex-wrap">
        {(Object.keys(CATEGORY_META) as NoticeCategory[]).map((c) => (
          <CategoryChip key={c} category={c} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>

      <Caption className="mt-6 mb-2">Target Audience</Caption>
      <View className="flex-row rounded-full border border-border-light dark:border-border-dark p-1 self-start">
        <AnimatedPressable
          haptics="select"
          onPress={() => setAudience('all')}
          className={`rounded-full px-5 py-2 ${audience === 'all' ? 'bg-ink' : ''}`}
        >
          <BodyMedium className={audience === 'all' ? 'text-white' : ''}>All Students</BodyMedium>
        </AnimatedPressable>
        <AnimatedPressable
          haptics="select"
          onPress={() => setAudience('course')}
          className={`rounded-full px-5 py-2 ${audience === 'course' ? 'bg-ink' : ''}`}
        >
          <BodyMedium className={audience === 'course' ? 'text-white' : ''}>By Course</BodyMedium>
        </AnimatedPressable>
      </View>

      <View className={`flex-row mt-3 ${audience === 'course' ? '' : 'opacity-40'}`} pointerEvents={audience === 'course' ? 'auto' : 'none'}>
        <PickerField
          placeholder="Select course…"
          value={targetCourse}
          options={courses}
          onSelect={setTargetCourse}
        />
        <View className="w-3" />
        <PickerField
          placeholder="Semester…"
          value={targetSemester}
          options={semesters.map(String)}
          onSelect={setTargetSemester}
        />
      </View>

      <PrimaryButton
        label={publishing ? 'Publishing…' : 'Publish Notice'}
        disabled={publishing}
        onPress={publish}
        className="mt-8 self-stretch justify-center"
      />
    </Screen>
  );
}
