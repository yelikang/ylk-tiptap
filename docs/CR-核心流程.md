
# 核心解读
## 创建ExtensionManager
```
1. new Editor，会传递进去自定义的扩展；并挂载在editor.options.extensions上
2. 在createExtensionManager()中，整合核心扩展(options中可决定是否开启) + 自定义扩展
3. 将所有的extensions传递给ExtensionManager，构建extensionManager
4. ExtensionManager中，将所有extensions铺平flatten(因为有些extension中通过addExtensions会依赖其他extension，构建一个快速集成的extension，例如:starter-kit)
5. 然后排序，按照option中的priority优先级，数字越大优先级越高；确保高优先级的扩展先处理
6. 通过extensions，构建prosemirror-model的schema
7. setupExtensions 遍历所有extension，获取extension的storage，存储到this.editor.extensionStorage[extension.name]上；处理每个extension上定义的onBeforeCreate、onCreate等事件监听

8. extensionManager中会维护plugins的get方法，用于维护获取所有ProseMirror的插件(addProseMirrorPlugins)
```

## 创建extensionManager.schema
```
1. 拆分出nodeExtensions、markExtensions
2. 获取所有extension中的定义的全局属性 addGlobalAttributes (Text-align中有定义)
3. 获取nodeExtensions、markExtensions中定义的自身属性 addAttributes (link中有定义)
4. 收集到的allAttributes属性，用于在构建schema的attrs时使用；然后在html解析的时候，注入attrs属性
5. 构建schema的过程中，会执行Node的parseHTML(如果有)，获取schema的解析规则
```

## 创建CommandManager
```
1. commandManager初始化时，会使用editor.extensionManager.commads上的属性赋值
2. 而commands是定义个extensionManager上的一个get属性，会读取所有extension中定义的commands属性，合并到一个对象中(包含核心extension + 自定义extension)；例如核心中core/src/extensions/Commands；会包含一些列的blur、cut等command
```

## 创建editor.schema
```
1. 实际就是将editor.extensionManager.schema赋值给editor.schema
```

## 创建EditorView（重点）
```
1. 使用extensions构建schema
2. 使用schema构建doc：调用promise中的DOMParseser、Fragment等
3. 使用doc构建EditorState
4. 使用EditorState构建EditorView
5. 构建EditorView过程中，会创建 this.docView = docViewDesc；该方法中的updateChildren方法，会递归处理每个节点；构建NodeViewDesc对象
   a. updateChildren中的iterDeco会递归处理每个node(也是树状包含结构)，并会构造updatar(ViewTreeUpdater对象)去addNode，构造子的NodeViewDesc
   b. 子的NodeViewDesc中又会调用updateChildren,进行递归处理
   c. parseHTML：
      1. createDocument创建prosemirror 的doc时 -> createNodeFromContent -> elementFromString(content) 将文本内容转换为dom元素 -> 转换为promisemirror 的Node
      2. 构建ExtensionManager时，会将所有的extensions中的parseHTML进行解析，获取所有的解析规则(parseDOM)
      3. createNodeFromContent在elementFromString(content)调用后，调用parser.parse将dom元素内容逐步递归；解析为promisemirror 的Node，并形成一个树状结构的Node
      4. 过程中会通过matchTag -> matches（ (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector) ），与第2步中获取的parseDOM规则进行匹配，找到符合条件的匹配规则，
      5. 然后构建对应规则的Node；(会根据Node的优先级处理解析规则) —— DOMParser.fromSchema解析Node rule时，会记录每个rule对应的node(name)；匹配到rule之后，通过rule.name获取对应的Node类型；然后创建Node（addElementByRule：nodeType = this.parser.schema.nodes[rule.node]）


   d. renderHTML：NodeViewDesc.create构造NodeViewDesc的过程中，会执行node.type.spec.toDOM!(node)；实际调用定义在Node中的 renderHTML 方法，获取节点的HTML描述内容（ep: ['span', { class: 'text-red' }, 'hello']）；DOMSerializer.renderSpec会将描述内容转换为真实的dom节点（dom元素类型，属性等）；并挂载在ViewDesc(NodeViewDesc | TextViewDesc)的dom上
   e. 递归完后，在renderDescs上会将NodeViewDesc上的dom挂载到真实的dom上


```


## 一系列editor的事件监听
``` ts
this.on('beforeCreate', this.options.onBeforeCreate)

```



## 解析过程
```
parseHTML： 生成parseDOM规则，用于 HTML -> Node的识别(用css选择器匹配标签)；文本html内容识别为Node
renderHTML： 生成toDOM规则，用于 Node -> DOM的渲染(返回RenderSpec数组)；Node转换为实际的dom节点


parserHTML： 在构建ExtensionManager时，会遍历所有extension，调用它们的parseHTML，获取他们的解析规则(injectExtensionAttributesToParseRule)；存储到schema.parseDOM上

createDocument创建doc时候，会解析content内容；并通过promisemirror中的DOMParser.fromSchema解析出schema中的所有parser解析规则；然后使用parseHTML的解析规则，将context内容解析为Node

DOMParser.fromSchema也是将schema中nodes、marks所有extension的spec上的parseDOM解析出来，形成rules；然后构建一个DOMParser;

先使用elementFromString将content文本内容转换为真实的dom元素

使用parser.parse解析dom内容，并结合rules进行解析?
  1. parse方法中会将转换出来的dom元素，递归每个childNodes，然后与parser中的rules匹配(也就是每个extension中的parseHTML规则)，构建对应的Node?


```




## prosemirror 核心
```
1. 通过contenteditable元素的内容监听，当内容发生变化时，会触发事件
2. promisemirror中会维护EditorState、EditorView

```
