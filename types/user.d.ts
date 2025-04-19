export interface UserInfo  {
  stu_id: string; // 学号
  birthday: string; // 生日
  name: string; // 姓名
  sex: string; // 性别
  college: string; // 所属学院
  grade: string; // 所属年级
  major: string; // 所属专业

};
// 本地登录凭证
export interface LoginCredentials {
  identifier: string; // 本科生的身份识别用 id，研究生会设置为 5 个 0
  cookies: string; // 传递给教务系统的 Cookie Raw
}
export interface SSOCredentials {
  cookies: string; // 传递给统一认证的 Cookie Raw
}
// 本地用户信息
interface LocalUserInfo {
  type: string;
  userid: string;
  password: string;
}