import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutGrid, ClipboardList, Megaphone, BarChart3, MoreHorizontal } from 'lucide-react-native';
import { FloatingTabBar } from '@/components/ui/BottomNav';

const icons = {
  home: LayoutGrid,
  quizzes: ClipboardList,
  notices: Megaphone,
  analytics: BarChart3,
  more: MoreHorizontal,
};

export default function TeacherLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="quizzes" />
      <Tabs.Screen name="notices" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
