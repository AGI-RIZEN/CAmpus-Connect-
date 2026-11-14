import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutGrid, ClipboardCheck, Megaphone, Users, MoreHorizontal } from 'lucide-react-native';
import { FloatingTabBar } from '@/components/ui/BottomNav';

const icons = {
  dashboard: LayoutGrid,
  approvals: ClipboardCheck,
  notices: Megaphone,
  groups: Users,
  more: MoreHorizontal,
};

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="approvals" />
      <Tabs.Screen name="notices" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
