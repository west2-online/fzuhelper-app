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
              className={`mb-2 rounded-lg border-2 p-3 ${participant.isBusy ? 'border-red-500' : 'border-green-500'}`}
            >
              <Text className="font-medium">{participant.name}</Text>
              {participant.college && (
                <Text className="text-xs text-text-secondary">
                  {participant.college} · {participant.major}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </FloatModal>
  );
};

export default memo(SlotDetailModal);
