### 1. Extension（基础扩展）
定义 ：Extension 是最基础的扩展类型，用于提供编辑器的功能性特性，不直接影响文档结构或内容样式。

特点 ：

- 不在文档 DOM 中产生可见元素
- 主要提供功能性服务（如历史记录、快捷键等）
- 通过插件系统与编辑器交互
示例 ：History 扩展

```
export const History = Extension.
create<HistoryOptions>({
  name: 'history',
  
  addOptions() {
    return {
      depth: 100,           // 历史记录深度
      newGroupDelay: 500,   // 分组延迟
    }
  },

  addCommands() {
    return {
      undo: () => ({ state, dispatch }) => undo
      (state, dispatch),
      redo: () => ({ state, dispatch }) => redo
      (state, dispatch),
    }
  },

  // 添加 ProseMirror 插件
  addProseMirrorPlugins() {
    return [history(this.options)]
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo
      (),
      'Shift-Mod-z': () => this.editor.commands.
      redo(),
    }
  },
})
```
### 2. Node（节点扩展）
定义 ：Node 定义文档的结构性元素，是文档树中的块级或内联节点。

特点 ：

- 在文档中占据独立的位置
- 有明确的开始和结束边界
- 可以包含其他节点或文本内容
- 定义文档的层次结构
示例 ：Paragraph 扩展

```
export const Paragraph = Node.
create<ParagraphOptions>({
  name: 'paragraph',
  
  priority: 1000,
  
  group: 'block',        // 块级节点
  content: 'inline*',    // 可包含任意内联内容
  
  parseHTML() {
    return [{ tag: 'p' }]  // 解析 <p> 标签
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.
    HTMLAttributes, HTMLAttributes), 0]
  },
  
  addCommands() {
    return {
      setParagraph: () => ({ commands }) => {
        return commands.setNode(this.name)  // 
        设置节点类型
      },
    }
  },
})
```
### 3. Mark（标记扩展）
定义 ：Mark 定义文本的样式标记，用于给文本内容添加格式化效果。

特点 ：

- 不改变文档结构，只影响文本样式
- 可以跨越多个字符或单词
- 可以重叠应用（如同时加粗和斜体）
- 附着在文本节点上
示例 ：Bold 扩展

```
export const Bold = Mark.create<BoldOptions>({
  name: 'bold',
  
  parseHTML() {
    return [
      { tag: 'strong' },
      { tag: 'b', getAttrs: node => (node as 
      HTMLElement).style.fontWeight !== 
      'normal' && null },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['strong', mergeAttributes(this.
    options.HTMLAttributes, HTMLAttributes), 0]
  },
  
  addCommands() {
    return {
      setBold: () => ({ commands }) => commands.
      setMark(this.name),
      toggleBold: () => ({ commands }) => 
      commands.toggleMark(this.name),
      unsetBold: () => ({ commands }) => 
      commands.unsetMark(this.name),
    }
  },
  
  // 输入规则：**text** 自动转为粗体
  addInputRules() {
    return [
      markInputRule({
        find: /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]
        +))\*\*(?!\s+\*\*))$/,
        type: this.type,
      }),
    ]
  },
})
```
## 核心区别对比
特性 Extension Node Mark 作用范围 功能性服务 文档结构 文本样式 DOM 表现 无直接 DOM 独立 DOM 元素 包装文本的 DOM 位置特性 全局功能 占据文档位置 附着在文本上 内容包含 不包含内容 可包含其他节点/文本 不包含，只标记 典型示例 History, Collaboration Paragraph, Heading, Image Bold, Italic, Link 命令类型 功能命令 setNode , toggleNode setMark , toggleMark

## 实际应用场景
### Extension 使用场景：
- History ：撤销/重做功能
- Collaboration ：多人协作
- Placeholder ：占位符显示
- Focus ：焦点管理
### Node 使用场景：
- Paragraph ：段落
- Heading ：标题
- Image ：图片
- Table ：表格
- CodeBlock ：代码块
### Mark 使用场景：
- Bold ：粗体
- Italic ：斜体
- Link ：链接
- Code ：行内代码
- Highlight ：高亮
## 在编辑器中的协作关系
```
// 典型的编辑器配置
const editor = new Editor({
  extensions: [
    // 基础功能扩展
    History,
    
    // 文档结构节点
    Document,
    Paragraph,
    Heading,
    
    // 文本样式标记
    Bold,
    Italic,
    Link,
    
    // 基础文本节点
    Text,
  ]
})
```
这三种扩展类型共同构成了 Tiptap 的完整生态系统：Extension 提供功能支持，Node 构建文档结构，Mark 丰富文本样式，三者协同工作创造出强大而灵活的富文本编辑体验。
