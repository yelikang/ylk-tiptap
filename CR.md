
```mermaid
graph TD
    A1[Extension]
    A2[Node]
    A3[Mark]
```


## Editor
```js
 class Editor{
    view: EditorView - 视图（来源于prosemirror-view）
    extensionManager: ExtensionManager — 拓展管理器
    commandManager: CommandManager — 命令管理器

 }
```


## vue-editor
```js
class VueEditor extends Editor{

}
```

## vue-editor-content 只是用元素进行editor包裹，最后还是会将元素设定为editor的element
```js
export const VueEditorContent: component = {
watch{
    editor:{
        handler(){
            editor.setOptions{element}
            editor.createNodeViews()
        }
    }
}
}
```



## ExtensionManager  拓展管理器
```js
class ExtensionManager{
    extensions: Extension[] (Extension | Node | Mark)
}
```



## todo
- 如何根据内容匹配上对应的自定义Node的？ —— 好像是根据parseHTML匹配? - Editor createView构建doc阶段处理的？
- 如何手动构建自定义Node?
- 监听suggestion逻辑是什么?
- renderText 逻辑是什么? 渲染元素的文本内容?