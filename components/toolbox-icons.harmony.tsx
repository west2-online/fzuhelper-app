import { Image, type ImageSourcePropType } from 'react-native';

import ApartmentImage from '@/assets/images/toolbox/harmony/ic_apartment.png';
import ApplicationImage from '@/assets/images/toolbox/harmony/ic_application.png';
import ElectroCarImage from '@/assets/images/toolbox/harmony/ic_electrocar.png';
import ExamRoomImage from '@/assets/images/toolbox/harmony/ic_examroom.png';
import FileImage from '@/assets/images/toolbox/harmony/ic_file.png';
import FreeFriendsImage from '@/assets/images/toolbox/harmony/ic_free_friends.png';
import GradeImage from '@/assets/images/toolbox/harmony/ic_grade.png';
import GraduationImage from '@/assets/images/toolbox/harmony/ic_graduation.png';
import JiaXiImage from '@/assets/images/toolbox/harmony/ic_jiaxi.png';
import JobFiarImage from '@/assets/images/toolbox/harmony/ic_jobfair.png';
import LostFoundImage from '@/assets/images/toolbox/harmony/ic_lostandfound.png';
import MoreImage from '@/assets/images/toolbox/harmony/ic_more.png';
import NotificationImage from '@/assets/images/toolbox/harmony/ic_notification.png';
import OneKeyImage from '@/assets/images/toolbox/harmony/ic_onekey.png';
import RoomImage from '@/assets/images/toolbox/harmony/ic_room.png';
import FZURunImage from '@/assets/images/toolbox/harmony/ic_run.png';
import UtilityPaymentImage from '@/assets/images/toolbox/harmony/ic_shuidian.png';
import IDCardImage from '@/assets/images/toolbox/harmony/ic_studentcard.png';
import StudyCenterImage from '@/assets/images/toolbox/harmony/ic_studycenter.png';
import WikiImage from '@/assets/images/toolbox/harmony/ic_wiki.png';
import XiaoBenImage from '@/assets/images/toolbox/harmony/ic_xiaobenhua.png';
import XuankeImage from '@/assets/images/toolbox/harmony/ic_xuanke.png';
import ZHCTImage from '@/assets/images/toolbox/harmony/ic_zhct.png';

type ToolboxIconProps = {
  width?: number | string;
  height?: number | string;
};

const toDimension = (value: number | string | undefined, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createToolboxIcon = (source: ImageSourcePropType) => {
  return function ToolboxIcon({ width = 42, height = 42 }: ToolboxIconProps) {
    return (
      <Image
        source={source}
        resizeMode="contain"
        style={{ width: toDimension(width, 42), height: toDimension(height, 42) }}
      />
    );
  };
};

export const ApartmentIcon = createToolboxIcon(ApartmentImage);
export const ApplicationIcon = createToolboxIcon(ApplicationImage);
export const ElectroCarIcon = createToolboxIcon(ElectroCarImage);
export const ExamRoomIcon = createToolboxIcon(ExamRoomImage);
export const FileIcon = createToolboxIcon(FileImage);
export const FreeFriendsIcon = createToolboxIcon(FreeFriendsImage);
export const GradeIcon = createToolboxIcon(GradeImage);
export const GraduationIcon = createToolboxIcon(GraduationImage);
export const JiaXiIcon = createToolboxIcon(JiaXiImage);
export const JobFiarIcon = createToolboxIcon(JobFiarImage);
export const LostFoundIcon = createToolboxIcon(LostFoundImage);
export const MoreIcon = createToolboxIcon(MoreImage);
export const NotificationIcon = createToolboxIcon(NotificationImage);
export const OneKeyIcon = createToolboxIcon(OneKeyImage);
export const RoomIcon = createToolboxIcon(RoomImage);
export const FZURunIcon = createToolboxIcon(FZURunImage);
export const UtilityPaymentIcon = createToolboxIcon(UtilityPaymentImage);
export const IDCardIcon = createToolboxIcon(IDCardImage);
export const StudyCenterIcon = createToolboxIcon(StudyCenterImage);
export const WikiIcon = createToolboxIcon(WikiImage);
export const XiaoBenIcon = createToolboxIcon(XiaoBenImage);
export const XuankeIcon = createToolboxIcon(XuankeImage);
export const ZHCTIcon = createToolboxIcon(ZHCTImage);
