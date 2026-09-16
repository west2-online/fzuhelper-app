import AsyncStorage from '@react-native-async-storage/async-storage';

import { RejectEnum } from '@/api/enum';
import { putApiV1CourseCustom } from '@/api/generate';
import { queryClient } from '@/components/query-provider';
import { COURSE_PAGE_ALL_DATA_KEY } from '@/lib/constants';
import {
  CourseCache,
  forceRefreshCourseData,
  getCourseSetting,
  type CloudCustomCourse,
  type CustomCourse,
} from '@/lib/course';

/** 写入云端时请求体里的 course 字段，必填项与后端一致 */
export interface CloudCustomCoursePayload {
  id?: string;
  name: string;
  teacher: string;
  location: string;
  startClass: number;
  endClass: number;
  startWeek: number;
  endWeek: number;
  weekday: number;
  single: boolean;
  double: boolean;
  color: string;
  remark: string;
}

/**
 * 本地课程 → 云端请求体
 * 本地多出来的字段（priority、教务那些 raw 字段）都不发出去
 * @param courseId 传了表示更新这门课，不传表示新增（后端靠 id 是否为空区分）
 */
export const buildCustomCoursePayload = (course: CustomCourse, courseId?: string): CloudCustomCoursePayload => ({
  ...(courseId ? { id: courseId } : {}),
  name: course.name,
  teacher: course.teacher,
  location: course.location,
  startClass: course.startClass,
  endClass: course.endClass,
  startWeek: course.startWeek,
  endWeek: course.endWeek,
  weekday: course.weekday,
  single: course.single,
  double: course.double,
  color: course.color,
  remark: course.remark,
});

/** 历史本地数据是否已经全部上传到云端（一次性迁移的标记，存在本地） */
const MIGRATION_DONE_KEY = 'custom_course_migration_done';

const isMigrationDone = async (): Promise<boolean> => (await AsyncStorage.getItem(MIGRATION_DONE_KEY)) === '1';

const markMigrationDone = async (): Promise<void> => {
  await AsyncStorage.setItem(MIGRATION_DONE_KEY, '1');
};

/**
 * 内容比对：迁移重试时用来跳过上一次已经成功上传的课程，避免重复上传
 * （本地老数据没有服务端 id，只能靠内容判断，字段取的是能唯一确定一门课的那几个）
 */
const isSameCourse = (cloud: CloudCustomCourse, local: CustomCourse): boolean =>
  cloud.name === local.name &&
  cloud.location === local.location &&
  cloud.weekday === local.weekday &&
  cloud.startClass === local.startClass &&
  cloud.endClass === local.endClass &&
  cloud.startWeek === local.startWeek &&
  cloud.endWeek === local.endWeek;

/**
 * 把历史本地自定义课程补传到云端
 * 这些课程没有服务端 id，只能当新增提交
 * @returns 是否全部上传成功
 */
const uploadLocalCustomCourses = async (cloudCourses: CloudCustomCourse[], fallbackTerm: string): Promise<boolean> => {
  for (const local of CourseCache.flattenCustomCourses()) {
    if (cloudCourses.some(cloud => isSameCourse(cloud, local))) {
      continue;
    }

    const term = local.semester || fallbackTerm || (await getCourseSetting()).selectedSemester;
    if (!term) {
      console.warn(`自定义课程「${local.name}」没有学期信息，跳过迁移`);
      continue;
    }

    try {
      await putApiV1CourseCustom({ term, course: buildCustomCoursePayload(local) });
    } catch (error: any) {
      // 业务错误说明这门课本身有问题（比如字段超长），重试多少次都一样，跳过它继续迁移，
      // 否则一门坏数据会把整个迁移卡死，后面所有课程都传不上去
      if (error?.type === RejectEnum.BizFailed) {
        console.warn(`自定义课程「${local.name}」无法迁移到云端，已跳过：`, error.data);
        continue;
      }
      // 网络类错误就整体中止，留到下次再试
      console.warn(`自定义课程「${local.name}」迁移到云端失败，下次再试`, error);
      return false;
    }
  }
  return true;
};

/**
 * 强制刷新课表：和用户在课表页"下拉刷新"走同一套逻辑
 */
export const refreshCourseTable = async (): Promise<void> => {
  const setting = await getCourseSetting();
  await forceRefreshCourseData(setting.selectedSemester);
  queryClient.invalidateQueries({ queryKey: [COURSE_PAGE_ALL_DATA_KEY] });
};

/**
 * 让本地的自定义课程与云端对齐。
 *
 * 本地只是服务端数据的镜像，正常情况下这里就是一次覆盖。唯一的例外是历史数据迁移：
 * 云端功能上线之前，自定义课程只存在设备本地，服务端一无所知。如果直接用服务端的
 * 空列表覆盖，那些课程就永久丢了。所以迁移完成之前一律不覆盖，等全部上传成功后再让本地
 * 失效、重新拉一次，从此本地就完全是服务端的镜像。
 *
 * @param cloudCourses V2 课表返回的 custom_courses
 * @param semester 当前选中的学期（前端格式）
 * @returns 本地数据是否发生变化
 */
export const reconcileCustomCourses = async (cloudCourses: CloudCustomCourse[], semester: string): Promise<boolean> => {
  if (await isMigrationDone()) {
    CourseCache.markCustomCoursesMigrated();
    return CourseCache.setCustomCourses(cloudCourses, semester);
  }

  // 本地本来就没有历史课程（新用户、或已经迁移过的设备），直接进入正常覆盖模式
  if (CourseCache.flattenCustomCourses().length === 0) {
    await markMigrationDone();
    CourseCache.markCustomCoursesMigrated();
    return CourseCache.setCustomCourses(cloudCourses, semester);
  }

  const migrated = await uploadLocalCustomCourses(cloudCourses, semester);
  if (!migrated) {
    // 还有课程没传上去，这次先不动本地，等下次拿到网络再迁
    return false;
  }

  await markMigrationDone();
  CourseCache.markCustomCoursesMigrated();

  // 迁移完成：立刻重新拉一次，让服务端数据成为唯一来源
  await refreshCourseTable();
  return true;
};
