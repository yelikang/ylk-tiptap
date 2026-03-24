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
   a.  DOMParser.schemaRules中将schema中的nodes、marks上的parseDOM(extension上的parseHTML - 在getSchemaByResolvedExtensions进行了获取和转换)转换为[ParseRule]
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

构建步骤:
1. 在构建doc的Node过程中，就构建Node的层级树结构
- 逻辑顺序：先“打开父”，再“解析子”，最后“生成父”。
  - 进入非叶子节点时调用 enter/enterInner 把一个 NodeContext 压栈（父“占位”已建立）from_dom.ts:L680-697
  - 子节点会被依次解析并推入这个父的 content；当离开该父或需要同步时，通过 closeExtra 将子内容封装完成，再创建父节点压回上一层。
  - closeExtra 会把“栈上高于 open 的上下文”全部 finish 并挂到其父的 content 上
- 因此从数据实体的“创建时机”看：父节点对象的真正创建发生在其所有子内容就绪后（post-order），所以“先构建子，再构建父”。
