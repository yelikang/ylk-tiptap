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
    content: [
      {
        type: NodeType
        content: Fragment
      }
    ]
  }
}

```


