import React, { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Info, X } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { Body, Caption } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { uploadFile } from '@/lib/api/uploads';
import { createPost } from '@/lib/api/posts';
import { ApiRequestError } from '@/lib/api/client';

const MAX_IMAGES = 5;

export default function CreatePostScreen() {
  const toast = useToast();
  const [selected, setSelected] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [caption, setCaption] = useState('');
  const [gridWidth, setGridWidth] = useState(0);
  const [posting, setPosting] = useState(false);

  const addImage = async () => {
    if (selected.length >= MAX_IMAGES) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast('Photo library access is needed to add images', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - selected.length,
      quality: 0.8,
    });
    if (result.canceled) return;

    const assets = result.assets.slice(0, MAX_IMAGES - selected.length);
    if (assets.length > 0) {
      setSelected((prev) => [...prev, ...assets]);
      haptic.tap();
    }
  };

  const removeImage = (uri: string) => {
    setSelected((prev) => prev.filter((a) => a.uri !== uri));
    haptic.select();
  };

  const handlePost = async () => {
    if (posting) return;
    setPosting(true);
    try {
      const uploads = await Promise.all(selected.map((asset) => uploadFile(asset)));
      await createPost({ caption: caption.trim(), imageAssetIds: uploads.map((u) => u.assetId) });
      toast('Post submitted for review');
      haptic.success();
      router.back();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not submit your post';
      toast(message, 'error');
    } finally {
      setPosting(false);
    }
  };

  const gap = 10;
  const tileSize = gridWidth > 0 ? (gridWidth - gap * (MAX_IMAGES - 1)) / MAX_IMAGES : 0;
  const canSubmit = (caption.trim().length > 0 || selected.length > 0) && !posting;

  return (
    <Screen>
      <Header title="Create Post" />

      <Caption className="mb-2">Add photos (up to {MAX_IMAGES})</Caption>
      <View
        className="flex-row"
        style={{ gap }}
        onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
      >
        {Array.from({ length: MAX_IMAGES }).map((_, i) => {
          const asset = selected[i];
          return (
            <View
              key={i}
              style={{ width: tileSize, height: tileSize }}
              className="rounded-input overflow-hidden bg-card-lavender dark:bg-card-lavender-dark items-center justify-center"
            >
              {asset ? (
                <>
                  <Image source={{ uri: asset.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <Pressable
                    onPress={() => removeImage(asset.uri)}
                    style={{ width: 20, height: 20 }}
                    className="absolute top-1 right-1 rounded-full bg-black/60 items-center justify-center"
                  >
                    <X size={12} color="#fff" />
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={addImage} className="w-full h-full items-center justify-center">
                  <ImagePlus size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {selected.length > 0 && (
        <View className="mt-4">
          <Caption className="mb-2">Selected ({selected.length}/{MAX_IMAGES})</Caption>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selected.map((asset) => (
              <View key={asset.uri} style={{ width: 72, height: 72 }} className="mr-3">
                <Image source={{ uri: asset.uri }} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
                <Pressable
                  onPress={() => removeImage(asset.uri)}
                  style={{ width: 20, height: 20 }}
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-black/70 items-center justify-center"
                >
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="mt-5">
        <Caption className="mb-2">Caption</Caption>
        <View className="rounded-input bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark px-4 py-3">
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What's happening on campus?"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top' }}
            className="font-poppins text-body text-text-primary dark:text-text-primary-dark"
          />
        </View>
      </View>

      <Card tone="lavender" className="mt-5 flex-row items-start" noShadow>
        <Info size={18} color={colors.primary} />
        <Body className="ml-3 flex-1">Your post will be visible after admin approval.</Body>
      </Card>

      <PrimaryButton
        label={posting ? 'Posting…' : 'Post'}
        className="mt-8"
        disabled={!canSubmit}
        onPress={handlePost}
      />
    </Screen>
  );
}
