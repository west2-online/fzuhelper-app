import { ThemedView } from '@/components/ThemedView';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const NAVIGATION_TITLE = '课表设置';

export default function AcademicPage() {
  const [isPickerVisible, setPickerVisible] = useState(false); // 是否显示 Picker
  const [isCalendarExportEnabled, setCalendarExportEnabled] = useState(false); // 是否导出到日历
  const [isShowNonCurrentWeekCourses, setShowNonCurrentWeekCourses] = useState(false); // 是否显示非本周课程
  const [isAutoImportAdjustmentEnabled, setAutoImportAdjustmentEnabled] = useState(false); // 是否自动导入调课

  // 定义学期数据源（此处使用临时数据）
  const semesters = [
    { label: '2023年春季学期', value: 'spring_2023' },
    { label: '2023年秋季学期', value: 'fall_2023' },
    { label: '2024年春季学期', value: 'spring_2024' },
  ];

  const [selectedSemester, setSelectedSemester] = useState(semesters[0].value); // 默认使用第一学期（此处需要修改）

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // const getTermsData = useCallback(async () => {
  //   try {

  //   }
  // }

  // 选择学期开关
  const toggleSwitchSemester = useCallback(() => {
    setPickerVisible(prev => !prev);
  }, []);

  // 关闭 Picker
  const closePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  return (
    <ThemedView className="flex-1 bg-white p-4">
      {/* 菜单列表 */}
      <Text style={styles.sectionTitle}>课程数据</Text>
      <View className="space-y-4">
        <TouchableOpacity className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center space-x-4">
            <Text className="ml-5 text-lg text-foreground">刷新数据</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <TouchableOpacity className="flex-row items-center justify-between p-4" onPress={toggleSwitchSemester}>
          <View className="flex-row items-center space-x-4">
            <Text className="ml-5 text-lg text-foreground">切换学期</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>开关设置</Text>

      <View className="space-y-4">
        <TouchableOpacity
          className="flex-row items-center justify-between p-4"
          onPress={() => setCalendarExportEnabled(prev => !prev)} // 切换 Switch 状态
        >
          <View className="flex-row items-center space-x-4">
            <Text className="ml-5 text-lg text-foreground">导出到日历</Text>
          </View>
          <Switch
            value={isCalendarExportEnabled}
            onValueChange={() => setCalendarExportEnabled(prev => !prev)} // 保持逻辑一致
            style={styles.switch}
          />
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <TouchableOpacity
          className="flex-row items-center justify-between p-4"
          onPress={() => setShowNonCurrentWeekCourses(prev => !prev)} // 切换 Switch 状态
        >
          <View className="flex-row items-center space-x-4">
            <Text className="ml-5 text-lg text-foreground">显示非本周课程</Text>
          </View>
          <Switch
            value={isShowNonCurrentWeekCourses}
            onValueChange={() => setShowNonCurrentWeekCourses(prev => !prev)} // 保持逻辑一致
            style={styles.switch}
          />
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <TouchableOpacity
          className="flex-row items-center justify-between p-4"
          onPress={() => setAutoImportAdjustmentEnabled(prev => !prev)} // 切换 Switch 状态
        >
          <View className="flex-row items-center space-x-4">
            <Text className="ml-5 text-lg text-foreground">自动导入调课信息</Text>
          </View>
          <Switch
            value={isAutoImportAdjustmentEnabled}
            onValueChange={() => setAutoImportAdjustmentEnabled(prev => !prev)} // 保持逻辑一致
            style={styles.switch}
          />
        </TouchableOpacity>
      </View>

      {/* 底部弹出的 Picker */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide" // 从底部滑入
        onRequestClose={closePicker} // Android 的返回键关闭
      >
        {/* 点击背景关闭 */}
        <TouchableWithoutFeedback onPress={closePicker}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        {/* Picker 容器 */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>选择学期</Text>
          <Picker selectedValue={selectedSemester} onValueChange={itemValue => setSelectedSemester(itemValue)}>
            {semesters.map(semester => (
              <Picker.Item key={semester.value} label={semester.label} value={semester.value} />
            ))}
          </Picker>

          {/* 确认按钮 */}
          <TouchableOpacity style={styles.confirmButton} onPress={closePicker}>
            <Text style={styles.confirmButtonText}>确认</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明背景
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: '#007AFF', // iOS 风格的蓝色
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switch: {
    marginLeft: 'auto', // 自动将 Switch 推到右侧
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 10,
  },
});
