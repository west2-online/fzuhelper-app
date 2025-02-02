import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { toast } from 'sonner-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiV1JwchTermList } from '@/api/generate';
import LabelEntry from '@/components/LabelEntry';
import SwitchWithLabel from '@/components/Switch';
import { ThemedView } from '@/components/ThemedView';
import { useSafeResponseSolve } from '@/hooks/useSafeResponseSolve';
import { COURSE_SETTINGS_KEY } from '@/lib/constants';
import { Picker } from '@react-native-picker/picker';

const NAVIGATION_TITLE = '课程表设置';

export default function AcademicPage() {
  // 下面这些数据会在页面 Loading 时读取 AsyncStorage，如果没有才使用下列默认值
  const [isPickerVisible, setPickerVisible] = useState(false); // 是否显示 Picker
  const [isCalendarExportEnabled, setCalendarExportEnabled] = useState(false); // 是否导出到日历
  const [isShowNonCurrentWeekCourses, setShowNonCurrentWeekCourses] = useState(false); // 是否显示非本周课程
  const [isAutoImportAdjustmentEnabled, setAutoImportAdjustmentEnabled] = useState(false); // 是否自动导入调课
  const [semesters, setSemesters] = useState<{ label: string; value: string }[]>([]); // 动态加载的数据
  const { handleError } = useSafeResponseSolve(); // HTTP 请求错误处理
  const [selectedSemester, setSelectedSemester] = useState(''); // 默认使用第一学期（此处需要修改）
  const [semesterLabel, setSemesterLabel] = useState(''); // 学期标签
  const [isLoadingSemester, setLoadingSemester] = useState(false); // 是否正在加载学期数据

  // 设置导航栏标题
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: NAVIGATION_TITLE });
  }, [navigation]);

  // 更新学期标签，第一个参数为当前学期（例如 202401）
  const updateSemesterLabel = useCallback(
    (semester: string) => {
      const semesterObject = semesters.find(item => item.value === semester);
      if (semesterObject) {
        setSemesterLabel(semesterObject.label);
      }
    },
    [semesters],
  );

  // 从 AsyncStorage 的 COURSE_SETTINGS_KEY 中读取，是一个 json 数据
  const readSettingsFromStorage = useCallback(async () => {
    // 读取数据
    console.log('读取课程设置');
    const settings = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setSelectedSemester(parsedSettings.selectedSemester);

      // **直接更新标题，不依赖 semesters**
      const semester = parsedSettings.selectedSemester;
      const year = semester.slice(0, 4);
      const term = semester.slice(4) === '01' ? '春季' : '秋季';
      setSemesterLabel(`${year}年${term}学期`);

      setCalendarExportEnabled(parsedSettings.calendarExportEnabled);
      setShowNonCurrentWeekCourses(parsedSettings.showNonCurrentWeekCourses);
      setAutoImportAdjustmentEnabled(parsedSettings.autoImportAdjustmentEnabled);
    }
  }, []);

  // 将当前设置保存至 AsyncStorage，采用 json 形式保存
  const saveSettingsToStorage = useCallback(async () => {
    console.log('保存课程设置');
    const settings = {
      selectedSemester: selectedSemester,
      calendarExportEnabled: isCalendarExportEnabled,
      showNonCurrentWeekCourses: isShowNonCurrentWeekCourses,
      autoImportAdjustmentEnabled: isAutoImportAdjustmentEnabled,
    };
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(settings));
  }, [isCalendarExportEnabled, isShowNonCurrentWeekCourses, isAutoImportAdjustmentEnabled, selectedSemester]);

  // 页面加载时读取设置，页面卸载时保存设置
  useEffect(() => {
    (async () => {
      await readSettingsFromStorage(); // 再读取设置
    })();
  }, [readSettingsFromStorage]);

  // 获取学期数据
  const getTermsData = useCallback(async () => {
    try {
      const result = await getApiV1JwchTermList(); // 返回的数据格式为 ['202401', '202402'] 这样的

      // 将结果转换为用户友好的格式
      const formattedSemesters = result.data.data.map(term => {
        const year = term.slice(0, 4); // 获取年份
        const semester = term.slice(4); // 获取学期
        const label = `${year}年${semester === '01' ? '春季' : '秋季'}学期`; // 格式化标签
        return { label, value: term }; // 返回对象
      });
      setSemesters(formattedSemesters); // 更新学期数据源
      setSelectedSemester(prevSemester => {
        const validSemester = prevSemester || formattedSemesters[0]?.value;
        updateSemesterLabel(validSemester); // 更新学期标签
        return validSemester;
      });
    } catch (error: any) {
      const data = handleError(error);
      if (data) {
        toast.error(data.msg ? data.msg : '未知错误');
      }
    }
  }, [handleError, updateSemesterLabel]);

  // 选择学期开关
  const toggleSwitchSemester = useCallback(async () => {
    setLoadingSemester(true); // 设置加载状态
    await getTermsData(); // 获取学期数据
    setPickerVisible(prev => !prev);
    setLoadingSemester(false); // 取消加载状态
  }, [getTermsData]);

  // 关闭 Picker
  const closePicker = useCallback(() => {
    console.log(selectedSemester); // 打印选择的学期
    updateSemesterLabel(selectedSemester); // 更新学期标签
    setPickerVisible(false);
    saveSettingsToStorage(); // 保存设置
  }, [selectedSemester, updateSemesterLabel, saveSettingsToStorage]);

  return (
    <ThemedView className="flex-1 bg-white px-8 pt-8">
      {/* 菜单列表 */}
      <Text className="mb-2 text-sm text-foreground">课程数据</Text>

      <LabelEntry leftText="刷新数据" />

      <LabelEntry
        leftText="切换学期"
        rightText={isLoadingSemester ? '加载中...' : semesterLabel}
        onPress={toggleSwitchSemester}
        disabled={isLoadingSemester}
      />

      <Text className="mb-2 mt-4 text-sm text-foreground">开关设置</Text>

      <SwitchWithLabel
        label="导出到日历"
        value={isCalendarExportEnabled}
        onValueChange={() => setCalendarExportEnabled(prev => !prev)}
      />

      <SwitchWithLabel
        label="显示非本周课程"
        value={isShowNonCurrentWeekCourses}
        onValueChange={() => setShowNonCurrentWeekCourses(prev => !prev)}
      />

      <SwitchWithLabel
        label="自动导入调课信息"
        value={isAutoImportAdjustmentEnabled}
        onValueChange={() => setAutoImportAdjustmentEnabled(prev => !prev)}
      />

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
});
