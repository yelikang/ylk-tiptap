**Transaction（事务）**

- **原理**
  - Transaction 是对 `EditorState` 的一次“可组合的变更描述”。它在内部记录：
    - **文档变更**：通过 `Step` 列表（例如 replace、addMark、setNodeMarkup 等）累积起来，而不是直接改原文档；最终用这些 step 生成一个新的 `doc`。
    - **位置映射**：每个 step 会产生 `Mapping`，用于把旧位置（pos）映射到新文档的位置，保证后续 step、selection、插件状态能正确跟随变更。
    - **选择与滚动意图**：通常会携带新的 `selection`，以及 `scrollIntoView` 这类“视图提示”。
    - **元信息 meta**：用 `tr.setMeta(key, value)` 挂载“这次事务为什么发生/该怎么处理”的信号，供插件或 view 使用（例如输入法、协同编辑、历史记录过滤等）。
  - 事务本身是“渐进构建”的：你可以连续调用 `tr.insert(...)`、`tr.addMark(...)`、`tr.setSelection(...)`，最后 `dispatch(tr)` 一次性提交，让 state 通过 `apply(tr)` 产出新 state。

- **使用场景**
  - **任何会改变编辑器状态的操作**都最终归结为 Transaction：输入文本、删除、粘贴、格式加粗、包裹成列表、设置节点属性、替换选区内容等。
  - **插件扩展/业务命令**：写 command（如 `toggleMark`、自定义插入卡片）时，通常构造/修改 `tr` 并 `dispatch`。
  - **协同编辑与历史记录**：协同通常基于 step 序列传输；历史记录插件会根据 transaction 的 meta 或 step 类型决定是否入栈、如何合并。
  - **需要携带语义的变更**：比如“这是用户输入导致的事务”和“这是程序自动修复文档导致的事务”可用 meta 区分，避免插件互相误判或循环触发。

---

**Selection（选择）**

- **原理**
  - Selection 是“当前选区/光标”的抽象，不只是浏览器 DOM selection，而是**基于 ProseMirror 文档模型的位置（pos）**定义。
  - 它由 `from/to`（以及一些类型的额外信息）描述，并且必须与当前 `doc` 一致；当 doc 通过 transaction 改变后，selection 需要借助 transaction 的 mapping 做 **map**，把旧选区映射到新文档。
  - 常见类型：
    - `TextSelection`：文本范围/光标（最常用）。
    - `NodeSelection`：选中一个完整节点（如图片、嵌入卡片）。
    - `AllSelection`：选中整个文档。
    - 以及可扩展的自定义 Selection（少见，但用于特殊交互是可能的）。

- **使用场景**
  - **编辑命令的作用范围**：加粗、删除、包裹、替换等通常依据当前 selection 决定操作区域。
  - **光标/选区控制**：插入内容后把光标放到指定位置、选中刚插入的节点、实现“选中整个段落/卡片”等交互，需要显式 `tr.setSelection(...)`。
  - **键盘与鼠标交互**：方向键移动、Shift 选区扩展、点击节点选中等，都是 selection 在变化；插件经常监听 selection 变化来更新 UI（浮动工具条、提示菜单）。
  - **结构化文档的导航**：例如在表格/列表/标题之间移动，很多逻辑本质上是计算一个“合法的 Selection”。

---

**一句话对比**
- Transaction 解决“**怎么把状态从 A 变到 B**”（变更 + 映射 + 元信息）。
- Selection 解决“**用户现在指向/选中了哪里**”（基于 doc 的位置抽象，并可随事务映射）。
