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

