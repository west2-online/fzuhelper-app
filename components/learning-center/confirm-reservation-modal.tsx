import FloatModal from '@/components/ui/float-modal';
import { Text } from '@/components/ui/text';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface ConfirmReservationModalProps {
  visible: boolean; // 是否显示浮层
  onClose: () => void; // 关闭浮层的回调
  onConfirm: () => void; // 确认预约的回调
  onViewStatus?: () => void; // 查看占用情况的回调
  
  date: string; // 预约日期
  beginTime: string; // 开始时间
  endTime: string; // 结束时间
  selectedSpace: string | null; // 选中的座位号
}

const ConfirmReservationModal: React.FC<ConfirmReservationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onViewStatus,
  date,
  beginTime,
  endTime,
  selectedSpace,
}) => {
  return (
    <FloatModal visible={visible} title="确认预约" onClose={onClose} onConfirm={onConfirm}>
      <View className="space-y-8 px-2">
        {/* 预约信息卡片 */}
        <View className="rounded-xl p-5">
          <View className="mb-6">
            <Text className="mb-2 text-sm text-primary">预约日期</Text>
            <Text className="text-xl font-medium">{date}</Text>
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm text-primary">预约时段</Text>
            <Text className="text-xl font-medium">
              {beginTime} - {endTime}
            </Text>
          </View>

          <View>
            <Text className="mb-2 text-sm text-primary">座位号码</Text>
            {/* 座位号码，将换行符替换为空格 */}
            <Text className="text-xl font-medium">{selectedSpace?.replace('\n', ' ') || '无'}</Text>
          </View>
          {onViewStatus && (
            <TouchableOpacity
              className="mt-6 items-center rounded-lg bg-primary py-3"
              onPress={() => {
                onViewStatus();
                onClose();
              }}
            >
              <Text className="font-medium text-secondary">查询更多可用时间段</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </FloatModal>
  );
};

export default ConfirmReservationModal;
