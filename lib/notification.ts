import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiV1JwchAcademicScores, getApiV1JwchClassroomExam } from '@/api/generate';
import ExpoUmengModule from '@/modules/umeng-bridge';
import { md5 } from '@/utils/crypto';
import { fetchWithCache } from '@/utils/fetch-with-cache';
import {
  PermissionStatus,
  getTrackingPermissionsAsync,
  isAvailable,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import {
  ALLOW_PUSH_EVENT_KEYS,
  COURSE_SETTINGS_KEY,
  EXAM_ROOM_KEY,
  EXPIRE_ONE_DAY,
  GRADE_LIST_KEY,
  UMENG_JWCH_PUSH_TAG,
} from '../types/constants';

// Notification Manager 负责统筹管理 App 的通知交互，如 tag 上报等内容
// TODO: 没有做权限检查，需要在调用之前检查权限，这部分待测试后判断是否应当引入检查
export class NotificationManager {
  private static allowJWCHTeachingNotice = false; // 是否允许教务处通知
  private static allowGradeUpdateNotice = false; // 是否允许成绩更新通知
  private static allowExamNotice = false; // 是否允许考试通知
  private static hasInit = false; // 是否已经初始化

  /**
   * @description 初始化通知推送，在程序入口处调用
   * 目前是在开屏页中调用
   */
  public static async init() {
    if (!this.hasInit) {
      // 请求追踪权限，仅限 iOS 且追踪权限可用时，且已经获取过权限
      // 这个要放在友盟之前，否则弹窗会直接没掉
      if (Platform.OS === 'ios' && isAvailable()) {
        // 获取追踪权限状态，如果不是已授权状态，则请求授权
        const { status } = await getTrackingPermissionsAsync();
        if (status !== PermissionStatus.GRANTED) {
          await requestTrackingPermissionsAsync();
          // 不需要判断授权结果，因为即使用户拒绝了，也不会影响正常使用
        }
        console.log('Tracking permission status:', status);
      }
      // 避免重复初始化
      ExpoUmengModule.initUmeng();
      await this.loadSettings();
      this.hasInit = true;
    }
  }

  /**
   * @description 注册通知推送，该函数应该在 CourseCache 加载后调用
   * 目前是在首页（即课表），在 cache 加载后调用。即使没有一个开关被打开也可以调用
   */
  public static async register() {
    await this.loadSettings(); // 不论首次还是非首次启动，都重新拉一次设置

    let tags: string[] = []; // 需要上报的 tag，默认为空

    // 教务处通知推送
    if (this.allowJWCHTeachingNotice) {
      tags.push(UMENG_JWCH_PUSH_TAG);
      console.log('注册教务处通知推送');
    }

    // 从 AsyncStorage 中获取当前学期信息
    const data = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);
    let settings = null;
    if (data) {
      settings = JSON.parse(data);
    }

    // 成绩更新通知，直接从 CourseCache 中获取
    // 这个设置被打开，用户至少已经登录过一次，这个函数被调用前已经加载过 CourseCache
    if (this.allowGradeUpdateNotice) {
      if (settings) {
        const result = await this.calMarkDigest(settings.selectedSemester);
        if (result.length > 0) {
          tags = tags.concat(result); // 合并 tags
          console.log('注册成绩更新通知，共计', result.length, '门课程');
        }
      } else {
        console.log('本地没有课程设置信息，无法注册成绩更新通知');
      }
    }

    // 考场推送通知，需要从本地存储中获取当前学期信息
    if (this.allowExamNotice) {
      if (settings) {
        const result = await this.calExamRoomDigest(settings.selectedSemester);
        if (result.length > 0) {
          tags = tags.concat(result); // 合并 tags
          console.log('注册考场通知，共计', result.length, '个考场');
        }
      } else {
        console.log('本地没有课程设置信息，无法注册考试通知');
      }
    }

    this.refreshTag(tags);
  }

  private static async refreshTag(newTags: string[]): Promise<void> {
    const oldTags = (await ExpoUmengModule.getAllTags()).data;
    if (oldTags.length > 0) {
      console.log('删除旧 tags: ', oldTags);
      await ExpoUmengModule.deleteTags(oldTags);
    }
    if (newTags.length > 0) {
      console.log('注册新 tags: ', newTags);
      await ExpoUmengModule.addTags(newTags);
    }
  }

  /**
   * @description 更新通知设置，在通知设置页面保存设置也需要调用这个函数
   */
  public static async loadSettings() {
    const data = await AsyncStorage.getItem(ALLOW_PUSH_EVENT_KEYS);
    console.log('loadSettings:', data);
    if (data) {
      const settings = JSON.parse(data);
      this.allowJWCHTeachingNotice = settings.allowJWCHTeachingNotice;
      this.allowGradeUpdateNotice = settings.allowGradeUpdateNotice;
      this.allowExamNotice = settings.allowExamNotice;
    }
    // 如果 data 不存在，通常是第一次启动，那么就不需要做任何事情，因为默认就已经是 false 了
  }

  // 计算考场的摘要，用作 flag，返回的是所有需要考试的摘要数组
  // 这里肯定会多计算那些需要考试，但没有实际考场的，但这个函数只是计算摘要，不会有太大性能问题
  private static async calExamRoomDigest(semester: string): Promise<string[]> {
    let result: string[] = [];

    // 由于只需要知道考场信息，而考场信息学期初就会给完（只是没给考场具体时间地点），所以缓存时间直接给 14 天
    const data = await fetchWithCache(
      [EXAM_ROOM_KEY],
      () => getApiV1JwchClassroomExam({ term: semester }),
      14 * EXPIRE_ONE_DAY, // 缓存 14 天
    );
    // 如果有数据，则提取需要考试的考场信息，聚合成一个数组
    // 对于每个item，聚合 name, teacher, credit 三个字段，然后计算 md5，作为 tag
    if (data.data) {
      for (const item of data.data.data) {
        result.push(await md5([item.name, item.teacher, item.credit].join('|'), 32));
      }
    }

    return result;
  }

  private static async calMarkDigest(semester: string): Promise<string[]> {
    let result: string[] = [];

    // 由于只需要知道课程信息，而课程信息在选课结束后就会提供（只是没成绩），所以缓存时间直接给 14 天
    const data = await fetchWithCache(
      [GRADE_LIST_KEY],
      () => getApiV1JwchAcademicScores(),
      14 * EXPIRE_ONE_DAY, // 缓存14 天
    );

    // 如果有数据，则提取需要考试的考场信息，聚合成一个数组
    // 对于每个item，聚合 name, semester(term), teacher, elective_type 4个字段，然后计算 md5，作为 tag
    // 详见 https://github.com/west2-online/fzuhelper-server/pull/207
    if (data.data) {
      // 过滤出当前学期的课程
      const filteredData = data.data.data.filter(item => item.term === semester);
      for (const item of filteredData) {
        result.push(await md5([item.name, item.term, item.teacher, item.elective_type].join('|'), 32));
      }
    }

    return result;
  }
}
