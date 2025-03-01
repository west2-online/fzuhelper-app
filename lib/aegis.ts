// @ts-expect-error Package `aegis-rn-sdk` did not have types definition.
import Aegis from 'aegis-rn-sdk';
import { Platform } from 'react-native';

import { ResultEnum } from '@/api/enum';

const aegis = new Aegis({
  id: 'VD0m3Sd9r0180Pjd2W', // 上报 id
  // TODO: 在学号发生变化以后填充 uin 字段，等待 #42, #104 合并后使用 useEffect + setConfig 方法动态设置，assigned to @renbaoshuo.
  // uin: '102401339', // 用户唯一 ID（可选）
  reportApiSpeed: true, // 开启接口测速
  hostUrl: 'https://rumt-zh.com',
  whiteListUrl: '', // 关闭白名单接口请求，减少金钱花销
  env: __DEV__ ? Aegis.environment.development : Aegis.environment.production,
  beforeRequest(data: any) {
    if (__DEV__) {
      console.log('aegis', data);
    }

    return data;
  },
  api: {
    retCodeHandler(_data: string) {
      try {
        const data = JSON.parse(_data);
        const isErr = ![ResultEnum.SuccessCode, ResultEnum.SuccessCodePaper].includes(data.code);

        if (__DEV__ && isErr) {
          console.log('aegis api ret code error', data);
        }

        return {
          // isErr 如果是 true 的话，会上报一条 retcode 异常的日志。
          isErr,
          code: data.code,
        };
      } catch {
        return {
          isErr: true,
          code: 0,
        };
      }
    },
  },
  ext1: `${Platform.OS} ${Platform.Version}`,
});

export default aegis;
