import React from 'react';
import { Linking, View } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';

export type FileItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploader: string;
  date: string;
  url: string;
};

function styleFor(type: string): { bg: string; color: string } {
  if (type === 'pdf') return { bg: 'bg-danger/15', color: colors.danger };
  if (type === 'ppt' || type === 'pptx') return { bg: 'bg-warning/15', color: colors.warning };
  return { bg: 'bg-primary/15', color: colors.primary };
}

export function FileRow({ file }: { file: FileItem }) {
  const { bg, color } = styleFor(file.type);
  const toast = useToast();

  const handleDownload = () => {
    Linking.openURL(file.url).catch(() => toast("Couldn't open that file", 'error'));
  };

  return (
    <Card tone="white" className="flex-row items-center mb-3">
      <View className={`w-11 h-11 rounded-full items-center justify-center ${bg}`}>
        <FileText size={20} color={color} />
      </View>
      <View className="flex-1 ml-3 pr-2">
        <BodyMedium numberOfLines={1}>{file.name}</BodyMedium>
        <Caption className="mt-1" numberOfLines={1}>
          {file.size} · {file.uploader} · {file.date}
        </Caption>
      </View>
      <IconButton size={40} variant="white" onPress={handleDownload}>
        <Download size={18} color={colors.textSecondary} />
      </IconButton>
    </Card>
  );
}
