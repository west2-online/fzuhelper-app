// @ts-expect-error Package `aegis-rn-sdk` did not have types definition.
import Aegis from 'aegis-rn-sdk';
import { Platform } from 'react-native';

import { SuccessCodeList } from '@/api/enum';

let setConfigQueue: any[] = [];

export let aegis: Aegis;

export const setAegisConfig = (config: any) => {
  if (aegis) {
    aegis.setConfig(config);
  } else {
    setConfigQueue.push(config);
  }
};

export const initAegis = () => {
  aegis = new Aegis({
    id: '16OgkSlLkaY1p29Qdr', // 上报 id
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
          const isErr = !SuccessCodeList.includes(data.code);

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

  setConfigQueue.forEach(config => {
    aegis.setConfig(config);
  });

  setConfigQueue = [];

  return aegis;
};
