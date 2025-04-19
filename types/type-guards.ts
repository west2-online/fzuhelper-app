import { RejectEnum, ResultEnum } from '@/api/enum';
import { type NativeLoginError } from './reject-error';

export type ApiData = 
  | {
      code: ResultEnum.SuccessCode;
      message: string;
      data: unknown;
    }
  | {
      code: Exclude<string, ResultEnum.SuccessCode>;
      message: string;
    };

export function isApiData(obj: unknown): obj is ApiData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    typeof obj.code === 'string' &&
    'message' in obj &&
    typeof obj.message === 'string'
  );
}

export interface Headers {
  'access-token'?: string;
  'refresh-token'?: string;
}

export function isHeaders(obj: unknown): obj is Headers {
  if (typeof obj !== 'object' || obj === null) return false;
  const headers = obj as Headers;
  return (
    (headers['access-token'] === undefined || typeof headers['access-token'] === 'string') &&
    (headers['refresh-token'] === undefined || typeof headers['refresh-token'] === 'string')
  );
}

export function isNativeLoginError(obj: unknown): obj is NativeLoginError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    obj.type === RejectEnum.NativeLoginFailed &&
    'data' in obj &&
    typeof obj.data === 'string'
  );
}
