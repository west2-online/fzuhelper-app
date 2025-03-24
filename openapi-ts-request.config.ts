import type { GenerateServiceProps } from 'openapi-ts-request';

// 自动通过apifox生成接口文档
export default {
  // schemaPath: './openapi.json', // 本地openapi文件
  serversPath: './api/generate', // 接口存放路径
  schemaPath: 'http://127.0.0.1:4523/export/openapi/4?version=3.0',
  requestLibPath: '../axios',
} as GenerateServiceProps;
