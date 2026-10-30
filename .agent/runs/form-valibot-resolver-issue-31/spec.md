# Spec: Form Valibot Resolver

## 1. Purpose

为现有 `Form.Root` 提供一个可选的 Valibot 校验适配器，使调用方可以用 Valibot schema 直接生成 `validate` 函数：

```tsx
import { valibotResolver } from "seam-react/valibot";

<Form.Root
  defaultValues={{ email: "", password: "" }}
  validate={valibotResolver(LoginSchema)}
  onSubmit={handleSubmit}
>
  {/* 现有 Form.Field 组合保持不变 */}
</Form.Root>;
```

本改造只新增独立子入口和 resolver，不创建第二套 Form、表单状态系统或校验协议。现有 `rules`、异步校验、`setError`、`setFormError`、服务端错误映射、错误清除和失败提交聚焦行为均保持不变。

Resolver 只负责把 schema 校验结果转换为现有 `FormErrors<T>`：

- 校验成功返回 `{}`。
- 校验失败将 issue 路径映射为 Form 的点分隔字段名。
- 每个字段默认保留第一个错误。
- 无可用路径的根级 issue 映射到保留键 `_form`，不得静默丢弃。
- 不修改输入 values，不写回 schema 输出变换，不维护额外 UI 或错误状态。

## 2. Pattern Selection

主模式：`form-control`。

辅助约束：`inline`，仅适用于文档示例中的现有 `Form.Actions` / `Button`，不新增组件或样式。

复用现有能力：

| 需求                   | 来源                                |
| ---------------------- | ----------------------------------- |
| 表单值、校验和提交状态 | 现有 `Form.Root`                    |
| 字段注册和点分隔路径   | 现有 `Form.Field`                   |
| 字段规则               | 现有 `rules`                        |
| 错误展示               | 现有 `Form.ErrorMessage`            |
| 表单级错误             | 现有 `setFormError` 与 `_form` 处理 |
| 服务端错误             | 现有 `setError` / `setFormError`    |
| 提交失败处理           | 现有 `onSubmitFailed`               |
| 错误字段聚焦           | 现有 Form 提交失败聚焦逻辑          |

不引入 overlay、navigation 或 Motion 模式。Resolver 是无 UI 的纯适配层，不新增 hooks、context、DOM、CSS 类或设计 token。

## 3. States

Resolver 自身不持有状态，也不创建 React 状态。以下状态全部由现有 Form 管理：

| 状态                | 行为                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| idle                | 尚未校验；Form 保持现有初始行为                                         |
| validating          | `validate` 返回 Promise 时沿用现有异步校验状态                          |
| valid               | schema 成功，resolver 返回 `{}`；不阻断提交                             |
| field-invalid       | issue 映射到点分隔字段路径；每个字段保留首个错误                        |
| form-invalid        | 无可用路径的 issue 写入 `_form`；提交失败并进入 `onSubmitFailed`        |
| stale-error-cleared | 后续校验或字段更新按现有 Form 规则清除旧错误                            |
| server-error        | 继续通过 `setError` / `setFormError` 写入，不与 resolver 建立第二套状态 |

字段 `rules` 与 resolver 同时存在时，沿用当前 Form 的校验执行和错误合并顺序。本功能不增加优先级、覆盖规则或新的合并状态。

## 4. Public API

### 4.1 子入口

```ts
import { valibotResolver } from "seam-react/valibot";
```

主入口 `seam-react` 不导出 `valibotResolver`，也不静态或动态导入 Valibot。

### 4.2 TypeScript 接口

```ts
import type { GenericSchema, GenericSchemaAsync, InferInput } from "valibot";
import type { FormErrors } from "seam-react";

export type ValibotSchema = GenericSchema | GenericSchemaAsync;

export type ValibotValidate<TSchema extends ValibotSchema> = (
  values: InferInput<TSchema>,
) => Promise<FormErrors<InferInput<TSchema>>>;

export function valibotResolver<const TSchema extends ValibotSchema>(
  schema: TSchema,
): ValibotValidate<TSchema>;
```

该函数可直接赋给现有 `Form.Root.validate`。当 `Form.Root` 的 `T` 与 `InferInput<TSchema>` 一致时，无需额外配置；调用方也可通过现有 Form 泛型显式标注相同的输入类型。

类型约束：

- 输入类型使用 `InferInput<TSchema>`，不是 `InferOutput<TSchema>`。
- 返回类型始终为 Promise，以统一支持同步和异步 schema，并兼容现有异步 `validate` 合约。
- 不新增 `resolver` prop，不扩展 `FormErrors` 的值类型，不引入结构化错误。
- 第一版不提供输出类型回写或 transformed-values 提交 API。需要输出值时，调用方在 `onSubmit` 内显式 parse。
- `_form` 是 resolver 的保留错误键。若 schema 同时存在名为 `_form` 的普通字段，调用方必须避免该命名冲突；resolver 不为冲突建立额外命名空间。

### 4.3 校验与错误映射

实现使用 Valibot `safeParseAsync(schema, values)`：

1. 原样传入 `values`，不 clone 后替换、不 mutate、不将 `result.output` 写回 Form。
2. `result.success === true` 时返回 `{}`。
3. 失败时按 `result.issues` 的原始顺序处理。
4. 将 `issue.path` 中可用的路径段转换为点分隔字段名：
   - 对象键使用其字符串形式。
   - 数组或数字索引使用十进制字符串，例如 `items.0.name`。
   - 路径段按现有 Form 点路径规则拼接。
5. 有可用路径时，以该路径作为错误键；同一键只写入第一次出现的 `issue.message`。
6. 无可用路径时，以 `_form` 作为错误键；多个根级 issue 同样只保留第一条。
7. 不使用 schema 输出值，不执行额外业务校验，不生成新的错误文案。

### 4.4 构建与依赖

- 新增独立构建入口 `seam-react/valibot`，生成与包现有模块格式和类型声明一致的产物。
- `valibot` 声明为 optional peer dependency，版本范围覆盖实现和测试实际使用的 Valibot API；在 `peerDependenciesMeta` 中标记 `"optional": true`。
- Valibot 同时作为开发依赖用于本仓库测试和构建，不进入主入口依赖图。
- `package.json` exports 增加 `./valibot`，主入口 `./` 保持不变。
- 打包配置将 `valibot` externalize，禁止把 Valibot bundle 进主入口。
- 新增公共 API 必须附带 minor Changeset，说明子入口、可选依赖和 `_form` 行为。

## 5. Keyboard Behavior

与 `form-control` 模式完全一致，无新增键盘交互。

- 不新增快捷键、焦点陷阱或按键处理。
- 无效提交继续由现有 Form 聚焦第一个可定位的错误字段。
- 仅存在 `_form` 错误时不发明新的聚焦目标；沿用现有 Form 对表单级错误的行为。
- 异步校验期间的键盘和提交行为沿用现有 Form。

## 6. Accessibility

Resolver 不渲染元素，因此不新增 role、ARIA 属性或 live region。

继续复用现有 Form 可访问性行为：

- `Form.Label` 与控件关联。
- `Form.Description` / `Form.ErrorMessage` 与字段的现有 ARIA 关联保持不变。
- 字段错误继续使用现有 `aria-invalid`、描述关联和错误展示机制。
- `_form` 错误由现有表单级错误展示和提交失败机制处理。
- 失败提交聚焦逻辑不变，不额外移动焦点或重复播报错误。

## 7. Failure States

| 失败场景                                | 规定行为                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| 单字段校验失败                          | 返回该字段路径到第一条 issue message 的映射                                   |
| 同字段多个 issue                        | 只保留按 Valibot issues 顺序出现的第一条                                      |
| 嵌套字段失败                            | 映射为现有 Form 可识别的点分隔路径                                            |
| 根级 object/refinement issue 无可用路径 | 映射为 `_form`，不得返回空错误或静默成功                                      |
| 多个根级 issue                          | `_form` 保留第一条                                                            |
| 异步 schema 失败                        | 与同步 schema 使用相同映射规则                                                |
| schema 带输出变换                       | 仅校验输入；可见 values 和提交 values 不被 resolver 替换                      |
| 字段 rules 与 resolver 均失败           | 按现有 Form 合并顺序处理，不新增优先级                                        |
| 服务端错误随后写入                      | 继续使用 `setError` / `setFormError`；后续清除行为由现有 Form 决定            |
| 无法定位字段的错误                      | 保留在错误对象中；仅第一个可定位字段参与现有聚焦流程                          |
| Valibot 未安装                          | 主入口仍可导入；只有实际导入 `seam-react/valibot` 时才要求消费者安装可选 peer |

不在 resolver 内捕获并改写非校验异常为字段错误。Promise rejection 继续遵循现有 `Form.Root.validate` 的异常处理约定。

## 8. Motion Gate

- **频率**：无。Resolver 只在现有 Form 触发校验时执行。
- **目的**：仅进行数据校验和错误格式转换，不提供视觉反馈。
- **实现**：无 React 渲染、无 CSS、无 Motion、无布局动画。
- **Token**：不新增或引用动画 token；现有 Form 和控件的视觉、动画及 reduced-motion 行为完全不变。

## 9. Test Plan

### 9.1 单元测试

覆盖 `valibotResolver`：

1. 有效值返回 `{}`。
2. 无效值返回对应字段错误。
3. 普通对象和嵌套对象路径映射为点分隔字段名。
4. 同字段多个 issue 只保留第一条。
5. 无可用路径的根级 issue 映射为 `_form`，且不会被误判为成功。
6. 同步 schema 可校验。
7. 异步 schema 可校验，成功和失败均覆盖。
8. 输入对象及嵌套输入在校验前后保持不被 resolver 修改。
9. 带输出变换的 schema 不把 output 写回输入或返回值。
10. 类型测试验证 `InferInput<TSchema>` 可直接用于现有 `Form.Root.validate`，并验证错误使用 output 类型时不通过。

### 9.2 Form 集成测试

使用现有 `Form.Root` / `Form.Field` 组合：

1. 无效提交阻断 `onSubmit`，调用现有 `onSubmitFailed`。
2. 有效提交调用 `onSubmit`，values 保持输入语义。
3. 异步 schema 校验期间和完成后行为正确。
4. 修正字段后旧 resolver 错误按现有规则清除。
5. 现有字段 `rules` 与 resolver 共存，并断言当前合并顺序不回归。
6. resolver 错误与 `setError` / `setFormError` 服务端错误共存及后续提交流程不回归。
7. 失败提交继续聚焦第一个可定位错误字段。
8. `_form` 错误使提交失败并进入 `onSubmitFailed`，不静默丢弃。
9. 现有非 resolver Form 测试全部通过，确认无行为回归。

### 9.3 包装与构建验证

1. 在临时消费项目中不安装 Valibot，验证可以导入 `seam-react` 并渲染 `Button`。
2. 验证主入口产物和类型声明不引用 Valibot。
3. 安装 Valibot 后验证 `seam-react/valibot` 的 runtime import 和类型解析。
4. 检查构建产物中 Valibot 保持 external，未被打入主 bundle。
5. 验证 package exports、declaration 输出和 optional peer metadata。
6. 新增 Changeset 并通过 Changeset 状态检查。
7. `pnpm check` 通过。
8. 包构建及现有测试套件通过。

### 9.4 文档

新增文档包含：

- `seam-react/valibot` 子入口和 Valibot 可选安装方式。
- `valibotResolver(schema)` API、输入类型推导和 Promise 返回行为。
- 使用现有 Form 组合的登录最小示例。
- 嵌套路径、每字段首错误和 `_form` 保留键说明。
- `_form` 限制：无可用路径的根级 issue 会归入该键，不展开为多错误 UI。
- schema 输出变换不会回写；需要输出值时在 `onSubmit` 内显式 parse。
- 与现有 `rules`、异步校验及服务端错误的兼容说明。

## 10. Open Questions

无。本 Spec 不新增 Form prop、状态机、错误协议或业务组件；所有行为均通过现有 `validate` 合约和独立可选子入口实现。
