import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Rss, Brain, MessageCircle, User } from 'lucide-react-native';
import { FloatingTabBar } from '@/components/ui/BottomNav';

const icons = {
  home: Home,
  feed: Rss,
  quiz: Brain,
  chat: MessageCircle,
  profile: User,
};

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="quiz" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
