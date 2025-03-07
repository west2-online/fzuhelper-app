// Description: 枚举定义 https://github.com/west2-online/fzuhelper-server/blob/main/pkg/errno/code.go
export enum ResultEnum {
  SuccessCode = '10000',
  ParamErrorCode = '20001', // 参数错误
  ParamEmptyCode = '20002', // 参数为空
  ParamMissingHeaderCode = '20003', // 缺少请求头数据（id or cookies）
  ParamInvalidCode = '20004', // 参数无效
  ParamMissingCode = '20005', // 参数缺失
  ParamTooLongCode = '20006', // 参数过长
  ParamTooShortCode = '20007', // 参数过短
  ParamTypeCode = '20008', // 参数类型错误
  ParamFormatCode = '20009', // 参数格式错误
  ParamRangeCode = '20010', // 参数范围错误
  ParamValueCode = '20011', // 参数值错误
  ParamFileNotExistCode = '20012', // 文件不存在
  ParamFileReadErrorCode = '20013', // 文件读取错误

  AuthErrorCode = '30001', // 鉴权错误
  AuthInvalidCode = '30002', // 鉴权无效
  AuthAccessExpiredCode = '30003', // 访问令牌过期
  AuthRefreshExpiredCode = '30004', // 刷新令牌过期
  AuthMissingCode = '30005', // 鉴权缺失

  BizErrorCode = '40001', // 业务错误
  BizLogicCode = '40002', // 业务逻辑错误
  BizLimitCode = '40003', // 业务限制错误
  BizNotExist = '40005', // 业务不存在错误
  BizFileUploadErrorCode = '40006', // 文件上传错误(service 层)
  BizJwchCookieExceptionCode = '40007', // jwch cookie异常

  InternalServiceErrorCode = '50001', // 未知服务错误
  InternalDatabaseErrorCode = '50002', // 数据库错误
  InternalRedisErrorCode = '50003', // Redis错误
  InternalNetworkErrorCode = '50004', // 网络错误
  InternalTimeoutErrorCode = '50005', // 超时错误
  InternalIOErrorCode = '50006', // IO错误
  InternalJSONErrorCode = '50007', // JSON错误
  InternalXMLErrorCode = '50008', // XML错误
  InternalURLEncodeErrorCode = '50009', // URL编码错误
  InternalHTTPErrorCode = '50010', // HTTP错误
  InternalHTTP2ErrorCode = '50011', // HTTP2错误
  InternalGRPCErrorCode = '50012', // GRPC错误
  InternalThriftErrorCode = '50013', // Thrift错误
  InternalProtobufErrorCode = '50014', // Protobuf错误
  InternalSQLErrorCode = '50015', // SQL错误
  InternalNoSQLErrorCode = '50016', // NoSQL错误
  InternalORMErrorCode = '50017', // ORM错误
  InternalQueueErrorCode = '50018', // 队列错误
  InternalETCDErrorCode = '50019', // ETCD错误
  InternalTraceErrorCode = '50020', // Trace错误

  SuccessCodePaper = '2000', // [历年卷] 在旧版 Android APP 中的 SuccessCode 是 2000，此处用作兼容
  SuccessCodeVerifyCode = '200', // [验证码] 在旧版 Android APP 中的 SuccessCode 是 200，此处用作兼容
}

export const SuccessCodeList = [
  ResultEnum.SuccessCode,
  ResultEnum.SuccessCodePaper,
  ResultEnum.SuccessCodeVerifyCode,
] as const;

export enum RejectEnum {
  AuthFailed = '10001', // 鉴权异常
  ReLoginFailed = '10002', // 重新登录异常
  BizFailed = '10003', // 业务异常
  InternalFailed = '10004', // Axios 内部异常
  Timeout = '10005', // 请求超时
  NetworkError = '10006', // 网络异常
  NativeLoginFailed = '10007', // 本地登录异常
}
