export interface JWCHLocateDateResult  {
  week: number; // 当前第几周
  year: number; // 当前学年
  term: number; // 当前学期
};
export interface IdentifyRespData {
  color: string; // 颜色
  validTime: number; // 有效时间
  content: string; // 内容
}
export interface PayCodeRespData {
  devId: string;
  expiredTime: string;
  payAcctId: string;
  payPrdCode: string;
  prePayId: string;
}
interface LoginRespData {
  name: string;
  accessToken: string;
}
