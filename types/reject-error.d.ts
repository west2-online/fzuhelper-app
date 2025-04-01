import { type RejectEnum } from '@/api/enum';
import { type AxiosError } from 'axios';

export interface AuthError {
  type: RejectEnum.AuthFailed;
}
export interface ReLoginError {
  type: RejectEnum.ReLoginFailed;
  // 错误信息
  data: string;
}
export interface BizError {
  type: RejectEnum.BizFailed;
  data: unknown;
}
export interface AxiosInternalError {
  type: RejectEnum.InternalFailed;
  data: AxiosError<any, any>;
}
export interface TimeoutError {
  type: RejectEnum.Timeout;
}
export interface NetworkError {
  type: RejectEnum.NetworkError;
}
export interface NativeLoginError {
  type: RejectEnum.NativeLoginFailed;
  // 错误信息
  data: string;
}

export interface EvaluationNotFoundError {
  type: RejectEnum.EvaluationNotFound;
  data: string;
}

export type RejectError =
  | AuthError
  | ReLoginError
  | BizError
  | AxiosInternalError
  | TimeoutError
  | NetworkError
  | NativeLoginError
  | EvaluationNotFoundError;
