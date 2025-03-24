# 接口管理

## 运作方式

我们使用 oneapi 的自动更新（通过`yarn run oneapi`）同步 apifox 中的接口和`@/api`目录下的接口。

需要保证接口文档定义清晰。例如，如果你的接口没有要求传参，但是 apifox 中设计了一个 formdata，会导致 app 侧编写报错（比如提示需要传参等内容）

## 更新接口文档后自动生成请求

已有 Apifox 接口文档，生成请求client，推荐后端给每个接口都打上 tags，不要使用 apifox 的 API文档目录 作为 tags

1. 打开 Apifox 桌面客户端
2. 选择需要查阅 API 文档的服务，点击进入
3. 点击服务左侧工具栏目中的 项目设置
4. 点击 导出数据
5. 选择 OpenAPI Spec 版本：OpenAPI3.0 ，文件格式：JSON，包含 Apifox 扩展的 OpenAPI 字段（x-apifox-\*\*\*）：包含，将 API 文档的目录，作为 Tags 字段导出：否
6. 导出范围 导出全部 排除标签 admin
7. 点击 打开URL 按钮，会生成类似以下的临时的接口文档链接：http://127.0.0.1:4523/export/openapi/2?version=3.0
8. 修改 openapi-ts-request.config.ts 文件中的schemaPath为上面的链接
9. 运行 yarn run openapi 自动生成请求代码
