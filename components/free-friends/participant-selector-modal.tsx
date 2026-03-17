import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { UserFriendListResponse_Friend } from '@/api/backend';
import { Icon } from '@/components/Icon';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';

interface ParticipantSelectorModalProps {
  visible: boolean;
  friendList: UserFriendListResponse_Friend[] | undefined;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClose: () => void;
}

const ParticipantSelectorModal: React.FC<ParticipantSelectorModalProps> = ({
  visible,
  friendList,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onClose,
}) => {
  const renderCheckbox = useCallback(
    (checked: boolean) => (
      <View
        className={`h-5 w-5 items-center justify-center rounded ${checked ? 'bg-primary' : 'border border-border'}`}
      >
        {checked && <Icon name="checkmark-outline" size={14} color="white" />}
      </View>
    ),
    [],
  );

  return (
    <FloatModal visible={visible} title="选择参与人" onClose={onClose}>
      {/* Select all / Deselect all */}
      <View className="mb-3 flex flex-row gap-2">
        <Pressable className="flex-1 rounded-md bg-primary/10 py-2" onPress={onSelectAll}>
          <Text className="text-center text-sm font-medium text-primary">全选</Text>
        </Pressable>
        <Pressable className="flex-1 rounded-md bg-destructive/10 py-2" onPress={onDeselectAll}>
          <Text className="text-center text-sm font-medium text-destructive">清空</Text>
        </Pressable>
      </View>

      <ScrollView className="max-h-64">
        {/* Self */}
        <Pressable
          className="mb-2 flex flex-row items-center justify-between rounded-lg border border-border p-3"
          onPress={() => onToggle('self')}
        >
          <Text className="font-medium">我</Text>
          {renderCheckbox(selectedIds.has('self'))}
        </Pressable>

        {/* Friends */}
        {friendList?.map(friend => (
          <Pressable
            key={friend.stu_id}
            className="mb-2 flex flex-row items-center justify-between rounded-lg border border-border p-3"
            onPress={() => onToggle(friend.stu_id)}
          >
            <View className="flex-1">
              <Text className="font-medium">{friend.name}</Text>
              <Text className="text-xs text-text-secondary">
                {friend.college} · {friend.major}
              </Text>
            </View>
            {renderCheckbox(selectedIds.has(friend.stu_id))}
          </Pressable>
        ))}
      </ScrollView>
    </FloatModal>
  );
};

export default memo(ParticipantSelectorModal);
