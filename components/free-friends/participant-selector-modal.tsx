import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { toast } from 'sonner-native';

import { UserFriendListResponse_Friend } from '@/api/backend';
import { Icon } from '@/components/Icon';
import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';

interface ParticipantSelectorModalProps {
  visible: boolean;
  friendList: UserFriendListResponse_Friend[] | undefined;
  selectedIds: Set<string>;
  onConfirm: (ids: Set<string>) => void;
  onClose: () => void;
}

const ParticipantSelectorModal: React.FC<ParticipantSelectorModalProps> = ({
  visible,
  friendList,
  selectedIds,
  onConfirm,
  onClose,
}) => {
  const [draftSelectedIds, setDraftSelectedIds] = useState<Set<string>>(new Set(selectedIds));

  useEffect(() => {
    if (visible) {
      setDraftSelectedIds(new Set(selectedIds));
    }
  }, [visible, selectedIds]);

  const handleToggle = useCallback((id: string) => {
    setDraftSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const all = new Set(['self']);
    friendList?.forEach(f => all.add(f.stu_id));
    setDraftSelectedIds(all);
  }, [friendList]);

  const handleDeselectAll = useCallback(() => {
    setDraftSelectedIds(new Set());
  }, []);

  const handleConfirm = useCallback(() => {
    if (draftSelectedIds.size === 0) {
      toast.error('请至少选择一个参与人');
      return;
    }
    onConfirm(new Set(draftSelectedIds));
    onClose();
  }, [draftSelectedIds, onConfirm, onClose]);

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
    <FloatModal visible={visible} title="选择参与人" onClose={onClose} onConfirm={handleConfirm}>
      {/* Select all / Deselect all */}
      <View className="mb-3 flex flex-row gap-2">
        <Pressable className="flex-1 rounded-md bg-primary/10 py-2" onPress={handleSelectAll}>
          <Text className="text-center text-sm font-medium text-primary">全选</Text>
        </Pressable>
        <Pressable className="flex-1 rounded-md bg-destructive/10 py-2" onPress={handleDeselectAll}>
          <Text className="text-center text-sm font-medium text-destructive">清空</Text>
        </Pressable>
      </View>

      <ScrollView className="max-h-64">
        {/* Self */}
        <Pressable
          className="mb-2 flex flex-row items-center justify-between rounded-lg border border-border p-3"
          onPress={() => handleToggle('self')}
        >
          <Text className="font-medium">我</Text>
          {renderCheckbox(draftSelectedIds.has('self'))}
        </Pressable>

        {/* Friends */}
        {friendList?.map(friend => (
          <Pressable
            key={friend.stu_id}
            className="mb-2 flex flex-row items-center justify-between rounded-lg border border-border p-3"
            onPress={() => handleToggle(friend.stu_id)}
          >
            <View className="flex-1">
              <Text className="font-medium">{friend.name}</Text>
              <Text className="text-xs text-text-secondary">
                {friend.college} · {friend.major}
              </Text>
            </View>
            {renderCheckbox(draftSelectedIds.has(friend.stu_id))}
          </Pressable>
        ))}
      </ScrollView>
    </FloatModal>
  );
};

export default memo(ParticipantSelectorModal);
