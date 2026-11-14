import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { PrimaryButton } from '@/components/ui/Button';
import { BodyMedium, Body, Caption } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { FilterPill } from '@/components/screens/admin/FilterPill';
import { haptic } from '@/lib/haptics';
import { courses } from '@/lib/mock-data';
import { colors } from '@/lib/theme';
import { listUsers, type AdminUser } from '@/lib/api/admin';
import { createGroup } from '@/lib/api/chat';
import { ApiRequestError } from '@/lib/api/client';

export default function CreateGroupScreen() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const courseOptions = useMemo(() => ['All Courses', ...courses], []);
  const [course, setCourse] = useState(courseOptions[0]);

  const roleOptions = ['Everyone', 'Students', 'Teachers'] as const;
  const [roleFilter, setRoleFilter] = useState<(typeof roleOptions)[number]>('Everyone');

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // No `role` filter here — group members can be students or teachers, so we fetch
    // everyone active and just exclude other admins from the candidate list.
    listUsers({ status: 'Active' })
      .then((list) => setMembers(list.filter((m) => m.role !== 'Admin')))
      .catch((err) => {
        const message = err instanceof ApiRequestError ? err.message : 'Could not load members';
        toast(message, 'error');
      })
      .finally(() => setLoadingMembers(false));
  }, []);

  const roleFiltered =
    roleFilter === 'Everyone' ? members : members.filter((m) => m.role === (roleFilter === 'Students' ? 'Student' : 'Teacher'));
  const courseFiltered = course === 'All Courses' ? roleFiltered : roleFiltered.filter((m) => m.course === course);
  const filteredMembers = courseFiltered.filter((m) => m.fullName.toLowerCase().includes(search.toLowerCase()));
  const selectedMembers = members.filter((m) => selected.has(m.id));
  const canCreate = name.trim().length > 0 && selected.size > 0 && !creating;

  const toggle = (id: string) => {
    haptic.select();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      await createGroup({ name: name.trim(), memberIds: [...selected] });
      toast('Group created');
      haptic.success();
      router.back();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not create the group';
      toast(message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <Header title="Create Group" />

      <Input
        label="Group Name"
        placeholder="e.g. CSE Sem 4 - Official"
        value={name}
        onChangeText={setName}
        className="mb-4"
      />

      <Input
        label="Description"
        placeholder="What's this group about? (not saved yet)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={{ minHeight: 84, textAlignVertical: 'top' }}
        className="mb-4"
      />

      <Caption className="mb-2">Filter candidates</Caption>
      <View className="flex-row mb-5">
        <FilterPill
          label="Who"
          value={roleFilter}
          options={[...roleOptions]}
          onChange={setRoleFilter}
          className="mr-2 self-start"
        />
        <FilterPill
          label="Course"
          value={course}
          options={courseOptions}
          onChange={setCourse}
          className="self-start"
        />
      </View>

      <BodyMedium className="mb-3">Add Members</BodyMedium>
      <SearchBar
        placeholder="Search students & teachers"
        value={search}
        onChangeText={setSearch}
        className="mb-4"
      />

      {selectedMembers.length > 0 && (
        <View className="mb-4">
          <Caption className="mb-2">{selectedMembers.length} selected</Caption>
          <View className="flex-row flex-wrap">
            {selectedMembers.map((m) => (
              <View key={m.id} className="mr-2 mb-2">
                <Avatar uri={m.avatarUrl} name={m.fullName} size={40} ring />
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="mb-6">
        {loadingMembers ? (
          <ActivityIndicator color={colors.primary} />
        ) : filteredMembers.length === 0 ? (
          <Body className="text-text-secondary dark:text-text-secondary-dark text-center mt-4">
            No members found.
          </Body>
        ) : (
          filteredMembers.map((m) => {
            const isSelected = selected.has(m.id);
            const subtitle = m.role === 'Teacher' ? `Teacher · ${m.department ?? 'Faculty'}` : (m.course ?? '—');
            return (
              <Pressable key={m.id} onPress={() => toggle(m.id)} className="flex-row items-center py-2.5">
                <Avatar uri={m.avatarUrl} name={m.fullName} size={44} />
                <View className="flex-1 ml-3">
                  <BodyMedium>{m.fullName}</BodyMedium>
                  <Caption>{subtitle}</Caption>
                </View>
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center border-2 ${
                    isSelected ? 'bg-primary border-primary' : 'border-border-light dark:border-border-dark'
                  }`}
                >
                  {isSelected && <Check size={14} color="#fff" />}
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <PrimaryButton label={creating ? 'Creating…' : 'Create Group'} onPress={handleCreate} disabled={!canCreate} />
    </Screen>
  );
}
