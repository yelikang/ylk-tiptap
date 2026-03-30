# step1: Schema构建
1. 获取所有extensions，根据类型将extension转换为nodes、marks
2. 在prosemirror中构建schema，将nodes、marks转换为以下格式
```ts
schema = {
  nodes: {
    extensionname<NodeType>: {
      name: string
      schema: Schema
      spec<NodeSpec>
    }
  },
  marks: {
    extensionname<MarkType>: {
      name: string
      schema: Schema
      spec<MarkSpec>
    }
  }
}

type NodeType ={
  name: string  extension名称
  schema: Schema  当前schema本身
  spec:NodeSpec  extension原始数据
}
```

# step2: schema生成Doc
1. 在createView中，将options.content、schema、parseOptions转换为doc: Node
2. 通过prosemirror-model中的DOMParser.fromSchema(schema)构建DOMParser
   a.  DOMParser.schemaRules中将schema中的nodes、marks上的parseDOM(extension上的parseHTML - 在getSchemaByResolvedExtensions进行了获取和转换)转换为[ParseRule] -> 【DOM/HTML转换为Prosemirror Node文档时的解析规则表】 例如: p -> paragraph，在解析HTMLNode时，知道这个HTMLNode是p标签，就会转换成Promsemirror 的 paragraph节点

   b. 通过[ParseRule]，构建DOMParser => 并缓存在了schema.cached.domOarser上
3. 通过elementFromString(content)将options.content转换为DOMElement
4. 使用DOMParser解析DOMElement，生成doc: Node
    a. 解析过程中递归所有子元素
    b. 过程中使用[ParseRule]进行匹配
    c. 解析的所有内容都存储ParseContext的topContext: NodeContext的content中； this.nodes[0] = [topContext]; topContext就是包含topNode的上下文NodeContext
    d. 在 context.finish上下文结束时；调用this.nodes[0].finish，使用topNode的create(不是extension中的create，是对应extension转换后NodeType中的create)创建层级形式的doc: Node

层级结构如下
```ts
doc:Node = {
  type: NodeType
  content: Fragment = {
    size: number - 下级所有同级Node的nodeSize的和(也就是内容字符串的长度)
    content: [
      {
        type: NodeType
        content: Fragment
      }
    ]
  }
}

class Node{
  type: NodeType
  content: Fragment
  get nodeSize(): number { return this.isLeaf ? 1 : 2 + this.content.size }
}

class TextNode extends Node {
  get nodeSize() { return this.text.length }
}

```
## 节点parseHTML的解析与使用
### 解析位置
 1. 在DOMParser.fromSchema时，会调用DOMParser.schemaRules将schema中的nodes、marks上的parseDOM转换为[ParseRule]

```ts
type ParseRule = {
  tag: string
  // Node名称，例如tiptap Node.create创建的Node名称(custom-mention)
  node?: string
  // tiptap会在injectExtensionAttributesToParseRule统一对parseDOM，增加getAttrs的返回
  getAttrs?:()=>{}
}
```
### 使用位置
 1. 首先：tiptap的schema nodes: NodeSpec[]，转换为prosemirror的 Schema nodes: NodeType[]
 2. 在迭代解析字符串转换成的dom的addElement方法时，每个dom都使用 [ParseRule] 去匹配(根据tag)
 3. 匹配到后，根据node名称，从schema.nodes中获取对应的NodeType
    - nodeType = this.parser.schema.nodes[rule.node];
 4. nodeType作用：
    - 当遇到叶子节点时：调用nodeType.create创建Node实例；
    - 不是叶子节点时，会创建一个NodeContext上下文，用于存储当前节点的信息(nodeType作为NodeContext.type)；出栈时根据nodeType创建Node实例



## Doc构建步骤:
1. 在构建doc的Node过程中，就构建Node的层级树结构
- 逻辑顺序：先“打开父”，再“解析子”，最后“生成父”。
  - 进入非叶子节点时调用 enter/enterInner 把一个 NodeContext 压栈（父“占位”已建立）—— 【每一个非叶子节点都创建一个NodeContext】from_dom.ts:L680-697
  - 子节点会被依次解析并推入这个父NodeContext的 content；当离开该父或需要同步时，通过 closeExtra 将子内容封装完成，再创建压回上一层。
  - closeExtra 会把“栈上高于 open 的NodeContext上下文”全部 finish 并挂到其父的 content 上
- 因此从数据实体的“创建时机”看：父节点对象的真正创建发生在其所有子内容就绪后（post-order），所以“先构建子，再构建父”。


```ts
// tiptap Schema
schema = {
  topNode: extension,
  nodes:{
    extensionname:NodeSpec =  {
      parseDOM(){}
      toDOM(){}
      toText(){}
    }
  },
  marks:{
    extensionname:MarkSpec = {
      parseDOM(){}
      toDOM(){}
    }
  }
}

NodeSpec = {
  group:string
  inline:string
  parseDOM(){}
  toDOM(){}
  toText(){}
}

// tiptap Schema 转换为 Prosemirror Schema
Schema  = {
  nodes: NodeType = {
    extensionname<NodeType>: {
      name: string
      schema: Schema
      spec<NodeSpec>
    }
  }
}

type NodeType = {
  // extension名称
  name: string
  // 当前schema本身
  schema: Schema
  // extension原始数据
  spec:NodeSpec
  // 创建一个Node实例
  create()
}


// Prosemirror DOMParser
DOMParser = {
  schema: tiptap Schema
  content: string转换后的DOMNode
  parse(dom: DOMNode, options: ParseOptions = {}): Node {
    let context = new ParseContext(this, options, false)
    context.addAll(dom, Mark.none, options.from, options.to)
    return context.finish() as Node
  }
}

// Prosemirror ParseContext
ParseContext = {
  // 当前打开的节点层级索引
  open:number = 0
  parser: DOMParser
  // 解析过程中创建的所有NodeContext(每一个非叶子节点都创建一个NodeContext)
  nodes: NodeContext[]
}

// Prosemirror NodeContext(中间态，用于处理遇到非叶子节点的入栈出栈逻辑)
NodeContext = {
  // 当前节点的类型
  type: NodeType
  // 当前节点的所有子节点内容
  content: Node[]
}

// Prosemirror Node(最终态，用于构建层级树结构)
Node = {
  type: NodeType
  content: Fragment
}
// Prosemirror Fragment(类似数组结构，用于存储当前节点的所有子节点)
Fragment = {
  size: number - 下级所有同级Node的nodeSize的和(也就是内容字符串的长度)
  content: Node[]
}
```


# step3: 构建Selection

# step4: 构建EditorState
```ts
class EditorState{
  config: Configuration
  selection: Selection
  get plugins: this.config.plugins
  get tr: new Transaction(this)
}

class Configuration {
  schema: Schema
  feilds:FieldDesc<any>[]
  plugins: Plugin[] = []
}

class Plugin {
  key: PluginKey
  state:{
    init(){}
    apply(){}
  },
  props:{}
  views:{}
}

// 事务
class Transaction{

}
```

# step5: 构建EditorView
```ts
class EditorView{
  // 挂载编辑器的DOM元素
  dom: HTMLElement
  // 状态管理
  state: EditorState
  // 文档视图描述器(doc view descraption)
  docView: NodeViewDesc
  // 底层使用MutationObserver监听this.dom对象；内容变更时进行逻辑处理
  domObsever: DOMObserver
  // 输入状态控制器
  input: InputState
}

class NodeViewDesc {
}

class DomObserver{

}

class InputState{
  // 是否正在输入中
  composing: Boolean = false
}
```




# tiptap Editor对象
``` ts
class Editor {
  extensionManager: ExtensionManager
  commandManager: CommandManager
  schema: this.extensionManager.schema
  view: EditorView
  get state()=> this.view.state

}
```


# addOptions、addStorage、addAttributes的区别
## addOptions(何时使用：可让用户配置)
- 定义默认配置，最终通过configure 覆盖/合并
- 偏静态配置，不要把频繁变化的状态放这里(一般用于配置Extension的一些固有参数,然后外层可以通过configure覆盖)

## addStorage(何时使用：Extension运行时数据/方法,不进入文档)
- 用来给每个Extension提供独立的可变存储(Extension在构造时会调用addStorage方法)
- 可通过editor.storage.customExtensionName.userName 这类方式使用
- 不进入文档，不影响Schema;适合放缓存、计算函数、插件协作状态等

# addAttributes(何时使用：想把数据变成文档的一部分)
- 用来什么这个Node/Mark有哪些attrs、默认值、如何从HTML解析、如何渲染回HTML
- 这些属性会被汇总进schema的attrs，并在HTML解析时注入到parseRule的getAttrs里(实现:injectExtensionAttributesToParseRule)


# addInputRules
- 用来定义输入规则，用于在用户输入时触发命令(实现类似Markdown的自动格式化/转换效果)
- 返回 inputRule[]
- ExtensionManager在组装插件时，会遍历所有Extension，把每个Extension的addInputRules()收集到inputRules数组中，最后统一生成一个inputRulesPlugin插件挂载到ProseMirror
- 用户在输入时，会触发inputRulesPlugin上的handleTextInput方法，然后匹配到对应的rule，在rule中处理逻辑
