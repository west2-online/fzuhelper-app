import { Modal, Pressable, TouchableOpacity, View } from 'react-native';

import { UserFriendListResponse, UserFriendListResponse_Friend } from '@/api/backend';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/ui/text';

interface FriendListModalProps {
  visible: boolean;
  onClose: () => void;
  friendList?: UserFriendListResponse;
  selectedFriendId?: string;
  onSelectFriend: (friendId?: string) => void;
}

export function FriendListModal({
  visible,
  onClose,
  friendList,
  selectedFriendId,
  onSelectFriend,
}: FriendListModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      navigationBarTranslucent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 这里用 flex-1 确保整个 Modal 的背景可点击 */}
      <View className="flex-1 bg-[#00000050]">
        {/* 透明背景可点击关闭 */}
        <Pressable className="absolute inset-0" onPress={onClose} />

        {/* 弹出窗口 */}
        <View className="absolute left-4 top-28 w-1/2 max-w-md gap-1 rounded-xl bg-background p-5 shadow-xl">
          {/* 小箭头 */}
          <View className="absolute -top-1 left-20 h-3 w-3 rotate-45 bg-background" />
          <TouchableOpacity
            className="flex h-14 flex-row items-center justify-between"
            activeOpacity={0.7}
            onPress={() => {
              onSelectFriend(undefined);
              onClose();
            }}
          >
            <View className="flex flex-row items-center">
              <Text className="line-clamp-1 text-lg">我的课表</Text>
            </View>
            {!selectedFriendId && <Icon name="checkmark" size={20} color="#007AFF" />}
          </TouchableOpacity>
          {friendList?.map((friend: UserFriendListResponse_Friend) => (
            <TouchableOpacity
              key={friend.stu_id}
              className="flex h-14 flex-row items-center justify-between"
              activeOpacity={0.7}
              onPress={() => {
                onSelectFriend(friend.stu_id);
                onClose();
              }}
            >
              <View>
                <Text className="line-clamp-1 text-lg">{friend.name}</Text>
                <Text className="line-clamp-1 text-sm text-text-secondary">
                  {friend.grade}级{friend.college}
                  {friend.major}专业
                </Text>
              </View>
              {selectedFriendId === friend.stu_id && <Icon name="checkmark" size={20} color="#007AFF" />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity className="flex h-14 justify-center" activeOpacity={0.7}>
            <Text className="text-lg">好友管理</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
