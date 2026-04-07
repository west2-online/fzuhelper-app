import { memo } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';

const DAYS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export interface ParticipantStatus {
  name: string;
  college: string;
  major: string;
  isBusy: boolean;
  isError?: boolean;
}

export interface SlotInfo {
  week: number;
  day: number;
  period: number;
}

interface SlotDetailModalProps {
  slotInfo: SlotInfo | null;
  participants: ParticipantStatus[] | null;
  onClose: () => void;
}

const SlotDetailModal: React.FC<SlotDetailModalProps> = ({ slotInfo, participants, onClose }) => {
  const title = slotInfo ? `第${slotInfo.week}周 周${DAYS[slotInfo.day]} 第${slotInfo.period}节` : '';

  return (
    <FloatModal visible={!!slotInfo} title={title} onClose={onClose}>
      {participants && (
        <ScrollView className="max-h-64">
          {participants.map((participant, idx) => (
            <View
              key={idx}
              className={`mb-2 flex-row items-center justify-between rounded-lg border-2 p-3 ${
                participant.isError
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                  : participant.isBusy
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    : 'border-green-500 bg-green-50 dark:bg-green-950/20'
              }`}
            >
              <View>
                <Text className="font-medium">{participant.name}</Text>
                {participant.college && (
                  <Text className="text-xs text-text-secondary">
                    {participant.college} · {participant.major}
                  </Text>
                )}
              </View>
              <View>
                <Text
                  className={`text-sm font-bold ${
                    participant.isError
                      ? 'text-yellow-600 dark:text-yellow-500'
                      : participant.isBusy
                        ? 'text-red-500'
                        : 'text-green-500'
                  }`}
                >
                  {participant.isError ? '加载失败' : participant.isBusy ? '有课（忙碌）' : '无课（空闲）'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </FloatModal>
  );
};

export default memo(SlotDetailModal);
