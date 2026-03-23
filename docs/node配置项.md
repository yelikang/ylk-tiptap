## Node.create配置项
```ts
const Node = Node.create({
  // 节点名称，必填
  name: 'custom-mention',

  // 节点优先级，数字越大优先级越高
  priority: 1001,

  // 节点所属组别
  group: 'inline',

  // 是否为行内节点
  inline: true,

  // 节点是否可以包含其他内容
  content: 'text*',  // 可以包含任意文本
  // 或 'block+'  // 必须包含至少一个块级元素
  // 或 'inline*' // 可以包含任意数量的行内元素

  // ==================解析相关 ==================

   // 定义如何从 HTML 解析为节点
  parseHTML() {
    return [
      {
        tag: 'span',
        // 可以添加更多匹配条件
        getAttrs: (node) => ({
          // 从 HTML 元素获取属性
          id: node.getAttribute('data-id'),
          label: node.getAttribute('data-label'),
        }),
      },
    ]
  },
  /**
   * 1. 序列化/生成普通DOM结构(静态渲染)
   * 2. 在HTML导出/复制时，序列化为DOM
   */
  renderHTML({ node, HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },
  // 把节点序列化为 纯文本(getText方法会调用)
  renderText({ node }) {
    return node.attrs.label || ''
  },
  /**
   * 1. 接管节点的动态渲染（存在时renderHTML不参与渲染）
   * 2. 不参与HTML导出/复制等序列化场景
   */
  addNodeView(){}

  // ================== 属性定义 ==================
  // 定义节点的属性
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          return {
            'data-id': attributes.id,
          }
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          return {
            'data-label': attributes.label,
          }
        },
      },
    }
  },
  // ================== 命令相关 ==================
  // 添加自定义命令
  addCommands() {
    return {
      setMention: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    }
  },

  // 添加键盘快捷键
  addKeyboardShortcuts() {
    return {
      'Mod-@': () => this.editor.commands.setMention(),
    }
  },
  // ================== 输入规则 ==================
   // 定义输入规则，用于自动转换
  addInputRules() {
    return [
      new InputRule({
        find: /@(\w+)$/,
        handler: ({ match, chain }) => {
          chain()
            .insertContent({
              type: this.name,
              attrs: {
                id: match[1],
                label: match[1],
              },
            })
            .run()
        },
      }),
    ]
  },
  // ================== ProseMirror 特定配置 ==================
  // 定义节点在 ProseMirror 中的行为
  addProseMirrorPlugins() {
    return [
      new Plugin({
        // 插件配置
      }),
    ]
  },

  // 定义节点在 ProseMirror 中的视图（renderHTML是基础的渲染；addNodeView是更高级的渲染，用于创建可交互的DOM节点）
  addNodeView() {
    return ({ node, editor, getPos }) => {
      // 自定义节点视图
      return {
        dom: document.createElement('span'),
        update: (newNode) => {
          // 更新节点视图
          return true
        },
      }
    }
  },
  // 拓展节点的自定义NodeSpec（例如：extension-table添加tableRole属性）
  extendNodeSchema(extension)=>{}
})





```
