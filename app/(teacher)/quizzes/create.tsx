import React, { useMemo, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  Link2,
  Plus,
  Star,
  Users,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Body, BodyMedium, Caption, H2 } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import { courses, semesters, subjects } from '@/lib/mock-data';
import { createQuiz, type QuizVisibility } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses the "MMM D, YYYY" + "H:MM AM/PM" picker strings (see generateDateOptions/
 * generateTimeOptions below) into a real Date — a manual parser rather than `new Date(string)`,
 * since loose date-string parsing isn't guaranteed consistent across JS engines (V8 in dev vs.
 * Hermes on-device). */
function parseDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/.exec(dateStr.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr.trim());
  if (!dateMatch || !timeMatch) return null;
  const monthIndex = MONTHS.indexOf(dateMatch[1]);
  if (monthIndex === -1) return null;
  const day = parseInt(dateMatch[2], 10);
  const year = parseInt(dateMatch[3], 10);
  let hour = parseInt(timeMatch[1], 10) % 12;
  if (timeMatch[3].toUpperCase() === 'PM') hour += 12;
  const minute = parseInt(timeMatch[2], 10);
  return new Date(year, monthIndex, day, hour, minute, 0, 0);
}

/** Real, always-valid date options (today through the next N days), in the same
 *  "MMM D, YYYY" format `parseDateTime` expects. Previously this was a hardcoded 5-date list
 *  frozen at specific 2026 calendar dates — once the last of those passed, every option would
 *  be a past date and quiz creation would have no valid schedule to pick from at all. */
function generateDateOptions(daysAhead: number): string[] {
  const options: string[] = [];
  const today = new Date();
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    options.push(`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`);
  }
  return options;
}

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 7; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      options.push(`${displayHour}:${String(minute).padStart(2, '0')} ${period}`);
    }
  }
  options.push('11:59 PM');
  return options;
}

function PickerField({
  placeholder,
  value,
  options,
  onSelect,
  icon,
  className = '',
}: {
  placeholder: string;
  value: string | null;
  options: string[];
  onSelect: (v: string) => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className={className}>
      <AnimatedPressable
        haptics="tap"
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-3.5"
      >
        <View className="flex-row items-center flex-1">
          {icon && <View className="mr-2">{icon}</View>}
          <Body numberOfLines={1} className={value ? 'flex-1' : 'flex-1 text-text-secondary dark:text-text-secondary-dark'}>
            {value ?? placeholder}
          </Body>
        </View>
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
    </View>
  );
}

function StepBadge({ label, state }: { label: string; state: 'done' | 'active' | 'upcoming' }) {
  if (state === 'done') {
    return (
      <View className="w-7 h-7 rounded-full bg-success items-center justify-center">
        <Check size={14} color="#fff" />
      </View>
    );
  }
  return (
    <View
      className={`w-7 h-7 rounded-full items-center justify-center ${
        state === 'active' ? 'bg-primary' : 'border border-border-light dark:border-border-dark'
      }`}
    >
      <Caption className={state === 'active' ? 'text-white' : ''}>{label}</Caption>
    </View>
  );
}

type Draft = {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number | null;
  explanation?: string;
};

const emptyDraft = (id: string): Draft => ({
  id,
  text: '',
  options: ['', '', '', ''],
  correctIndex: null,
});

export default function CreateQuiz() {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [publishing, setPublishing] = useState(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [course, setCourse] = useState<string | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState('15');
  const [points, setPoints] = useState('10');
  const [totalQuestions, setTotalQuestions] = useState('10');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<QuizVisibility>('students');
  const dateOptions = useMemo(() => generateDateOptions(60), []);
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // Step 2
  const total = Math.max(1, parseInt(totalQuestions, 10) || 1);
  const [questions, setQuestions] = useState<Draft[]>([emptyDraft('q1')]);
  const [qIndex, setQIndex] = useState(0);
  const current = questions[qIndex];

  const goToStep2 = () => {
    if (!title.trim() || !subject || !course || !semester || !startDate || !startTime || !endDate || !endTime) {
      haptic.error();
      toast('Fill in the quiz details and schedule first', 'error');
      return;
    }
    haptic.select();
    setStep(2);
  };

  const updateCurrent = (patch: Partial<Draft>) => {
    setQuestions((qs) => qs.map((q, i) => (i === qIndex ? { ...q, ...patch } : q)));
  };

  const addNextQuestion = async () => {
    if (!current.text.trim() || current.options.some((o) => !o.trim()) || current.correctIndex === null) {
      haptic.error();
      toast('Fill every option and mark the correct one', 'error');
      return;
    }
    if (qIndex + 1 < total) {
      haptic.tap();
      setQuestions((qs) => [...qs, emptyDraft(`q${qIndex + 2}`)]);
      setQIndex((i) => i + 1);
      return;
    }

    // Last question — publish the whole quiz in one shot.
    const start = parseDateTime(startDate!, startTime!);
    const end = parseDateTime(endDate!, endTime!);
    if (!start || !end) {
      haptic.error();
      toast('Could not read the schedule — reselect the dates and times', 'error');
      return;
    }
    if (end <= start) {
      haptic.error();
      toast('End time must be after the start time', 'error');
      return;
    }

    if (publishing) return;
    setPublishing(true);
    try {
      await createQuiz({
        title: title.trim(),
        subject: subject ?? '',
        course: course!,
        semester: Number(semester),
        timeLimitMinutes: parseInt(timeLimit, 10) || 15,
        pointsPerQuestion: parseInt(points, 10) || 10,
        visibility,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()) as [string, string, string, string],
          correctIndex: q.correctIndex!,
          explanation: q.explanation?.trim() || undefined,
        })),
      });
      haptic.success();
      toast('Quiz published');
      router.replace('/(teacher)/quizzes');
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not publish the quiz';
      haptic.error();
      toast(message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const doneCount = qIndex;
  const leftCount = total - qIndex - 1;

  return (
    <Screen scroll contentClassName="pb-16">
      <View className="flex-row items-center justify-between pt-4 pb-5">
        <IconButton onPress={() => (step === 2 ? setStep(1) : router.back())}>
          <ChevronLeft size={22} color={colors.ink} />
        </IconButton>
        <View className="flex-1 ml-3">
          <H2>{step === 1 ? 'Create Quiz' : 'Add Questions'}</H2>
          <Caption numberOfLines={1}>
            {step === 1 ? 'Step 1 of 2 · Quiz Details' : `${title || 'Untitled Quiz'} · Step 2 of 2`}
          </Caption>
        </View>
        <View className="flex-row items-center">
          <StepBadge label="1" state={step === 1 ? 'active' : 'done'} />
          <View className="w-3 h-px bg-border-light dark:bg-border-dark mx-1" />
          <StepBadge label="2" state={step === 2 ? 'active' : 'upcoming'} />
        </View>
      </View>

      {step === 1 ? (
        <>
          <Caption className="mb-2">Quiz Title *</Caption>
          <View className="rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 mb-5">
            <TextInput
              placeholder="e.g. Calculus Mid-Term Quiz"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              className="py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
            />
          </View>

          <Caption className="mb-2">Subject</Caption>
          <PickerField
            placeholder="Select subject…"
            value={subject}
            options={subjects}
            onSelect={setSubject}
            icon={<BookOpen size={18} color={colors.textSecondary} />}
            className="mb-5"
          />

          <View className="flex-row mb-5">
            <View className="flex-1">
              <Caption className="mb-2">Course *</Caption>
              <PickerField placeholder="Course" value={course} options={courses} onSelect={setCourse} />
            </View>
            <View className="w-3" />
            <View className="flex-1">
              <Caption className="mb-2">Semester *</Caption>
              <PickerField
                placeholder="Semester"
                value={semester ? `Sem ${semester}` : null}
                options={semesters.map((s) => `Sem ${s}`)}
                onSelect={(v) => setSemester(v.replace('Sem ', ''))}
              />
            </View>
          </View>

          <View className="flex-row mb-5">
            <NumberField label="Time Limit" icon={<Clock size={16} color={colors.textSecondary} />} suffix="min" value={timeLimit} onChangeText={setTimeLimit} className="flex-1" />
            <View className="w-3" />
            <NumberField label="Pts / Question" icon={<Star size={16} color={colors.textSecondary} />} suffix="pts" value={points} onChangeText={setPoints} className="flex-1" />
          </View>

          <NumberField label="Total Questions" value={totalQuestions} onChangeText={setTotalQuestions} className="mb-5" />

          <Caption className="mb-2">Schedule</Caption>
          <View className="flex-row flex-wrap -mr-3 mb-5">
            <ScheduleCell label="Start Date" value={startDate} options={dateOptions} onSelect={setStartDate} icon={<Calendar size={14} color={colors.primary} />} />
            <ScheduleCell label="Start Time" value={startTime} options={timeOptions} onSelect={setStartTime} icon={<Clock size={14} color={colors.primary} />} />
            <ScheduleCell label="End Date" value={endDate} options={dateOptions} onSelect={setEndDate} icon={<Calendar size={14} color={colors.primary} />} />
            <ScheduleCell label="End Time" value={endTime} options={timeOptions} onSelect={setEndTime} icon={<Clock size={14} color={colors.primary} />} />
          </View>

          <Caption className="mb-2">Quiz Visibility</Caption>
          <View className="flex-row rounded-full border border-border-light dark:border-border-dark p-1 self-start mb-5">
            <AnimatedPressable
              haptics="select"
              onPress={() => setVisibility('students')}
              className={`flex-row items-center rounded-full px-4 py-2 ${visibility === 'students' ? 'bg-primary' : ''}`}
            >
              <Users size={15} color={visibility === 'students' ? '#fff' : colors.textSecondary} />
              <BodyMedium className={`ml-1.5 ${visibility === 'students' ? 'text-white' : ''}`}>Students Only</BodyMedium>
            </AnimatedPressable>
            <AnimatedPressable
              haptics="select"
              onPress={() => setVisibility('private')}
              className={`flex-row items-center rounded-full px-4 py-2 ${visibility === 'private' ? 'bg-primary' : ''}`}
            >
              <Link2 size={15} color={visibility === 'private' ? '#fff' : colors.textSecondary} />
              <BodyMedium className={`ml-1.5 ${visibility === 'private' ? 'text-white' : ''}`}>Private Link</BodyMedium>
            </AnimatedPressable>
          </View>

          <Caption className="mb-2">Quiz Summary</Caption>
          <Card tone="lavender" noShadow className="mb-6">
            <SummaryRow icon={<BookOpen size={16} color={colors.ink} />} text={subject ?? 'No subject selected'} />
            <SummaryRow icon={<Clock size={16} color={colors.ink} />} text={`${timeLimit || 0} min`} />
            <SummaryRow icon={<Star size={16} color={colors.ink} />} text={`${points || 0} pts/Q`} />
            <View className="h-px bg-black/10 my-2" />
            <Caption>{course ?? '—'} · {semester ? `Sem ${semester}` : '—'}</Caption>
          </Card>

          <AnimatedPressable
            haptics="tap"
            onPress={goToStep2}
            className="flex-row items-center justify-center bg-ink rounded-full py-4"
          >
            <BodyMedium className="text-white">Next · Add Questions</BodyMedium>
          </AnimatedPressable>
        </>
      ) : (
        <>
          <View className="flex-row items-center mb-3">
            <H2>
              Question {qIndex + 1} of {total}
            </H2>
            <View className="flex-row ml-3">
              <View className="bg-success/15 rounded-full px-2.5 py-1 mr-1.5">
                <Caption className="text-success font-poppins-semibold">{doneCount} done</Caption>
              </View>
              <View className="bg-text-secondary/15 rounded-full px-2.5 py-1">
                <Caption>{leftCount} left</Caption>
              </View>
            </View>
          </View>

          <View className="flex-row mb-6" style={{ gap: 4 }}>
            {Array.from({ length: total }).map((_, i) => (
              <View
                key={i}
                className={`flex-1 h-1.5 rounded-full ${
                  i < qIndex ? 'bg-success' : i === qIndex ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'
                }`}
              />
            ))}
          </View>

          <Caption className="mb-2">Question Text</Caption>
          <View className="rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 mb-5">
            <TextInput
              placeholder="Type the question…"
              placeholderTextColor={colors.textSecondary}
              value={current.text}
              onChangeText={(t) => updateCurrent({ text: t })}
              multiline
              textAlignVertical="top"
              className="py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
              style={{ minHeight: 60 }}
            />
          </View>

          {(['A', 'B', 'C', 'D'] as const).map((letter, i) => (
            <OptionRow
              key={i}
              letter={letter}
              value={current.options[i]}
              selected={current.correctIndex === i}
              onSelect={() => updateCurrent({ correctIndex: i })}
              onChangeText={(t) => {
                const next = [...current.options] as Draft['options'];
                next[i] = t;
                updateCurrent({ options: next });
              }}
            />
          ))}

          <Caption className="mt-2 mb-2">Explanation (optional)</Caption>
          <View className="rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 mb-6">
            <TextInput
              placeholder="Why is this the correct answer?"
              placeholderTextColor={colors.textSecondary}
              value={current.explanation ?? ''}
              onChangeText={(t) => updateCurrent({ explanation: t })}
              multiline
              textAlignVertical="top"
              className="py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
              style={{ minHeight: 60 }}
            />
          </View>

          <AnimatedPressable
            haptics="tap"
            onPress={addNextQuestion}
            disabled={publishing}
            style={{}}
            className={`bg-primary rounded-full px-2 py-2 flex-row items-center justify-between ${publishing ? 'opacity-60' : ''}`}
          >
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center ml-1">
              <Plus size={20} color="#fff" />
            </View>
            <BodyMedium className="text-white flex-1 text-center">
              {qIndex + 1 >= total ? (publishing ? 'Publishing…' : 'Finish Quiz') : 'Add Next Question'}
            </BodyMedium>
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-1">
              <CheckCircle2 size={20} color="#fff" />
            </View>
          </AnimatedPressable>
          <Caption className="text-center mt-2">
            {leftCount > 0 ? `${leftCount} more to complete the quiz` : 'Last question — review and finish'}
          </Caption>
        </>
      )}
    </Screen>
  );
}

function NumberField({
  label,
  icon,
  suffix,
  value,
  onChangeText,
  className = '',
}: {
  label: string;
  icon?: React.ReactNode;
  suffix?: string;
  value: string;
  onChangeText: (t: string) => void;
  className?: string;
}) {
  return (
    <View className={className}>
      <Caption className="mb-2">{label}</Caption>
      <View className="flex-row items-center rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4">
        {icon && <View className="mr-2">{icon}</View>}
        <TextInput
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          className="flex-1 py-3.5 font-poppins-semibold text-body text-text-primary dark:text-text-primary-dark"
        />
        {suffix && <Caption>{suffix}</Caption>}
      </View>
    </View>
  );
}

function ScheduleCell({
  label,
  value,
  options,
  onSelect,
  icon,
}: {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (v: string) => void;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ width: '50%' }} className="pr-3 mb-3">
      <AnimatedPressable
        haptics="tap"
        onPress={() => setOpen(true)}
        className="rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-3 py-3"
      >
        <View className="flex-row items-center mb-1">
          {icon}
          <Caption className="ml-1.5">{label}</Caption>
        </View>
        <BodyMedium numberOfLines={1}>{value ?? '—'}</BodyMedium>
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
    </View>
  );
}

function SummaryRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row items-center mb-1.5">
      <View className="w-6 items-center">{icon}</View>
      <Body className="ml-1.5" numberOfLines={1}>
        {text}
      </Body>
    </View>
  );
}

function OptionRow({
  letter,
  value,
  selected,
  onSelect,
  onChangeText,
}: {
  letter: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  onChangeText: (t: string) => void;
}) {
  return (
    <View
      className={`flex-row items-center rounded-input border px-3 py-2.5 mb-2.5 ${
        selected ? 'border-primary bg-primary/5' : 'border-border-light dark:border-border-dark bg-white dark:bg-surface-dark'
      }`}
    >
      <AnimatedPressable
        haptics="select"
        onPress={onSelect}
        scaleTo={0.85}
        className={`w-7 h-7 rounded-full items-center justify-center border mr-3 ${
          selected ? 'bg-primary border-primary' : 'border-border-light dark:border-border-dark'
        }`}
      >
        <Caption className={selected ? 'text-white' : ''}>{letter}</Caption>
      </AnimatedPressable>
      <TextInput
        placeholder={`Option ${letter}`}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 font-poppins text-body text-text-primary dark:text-text-primary-dark"
      />
    </View>
  );
}
