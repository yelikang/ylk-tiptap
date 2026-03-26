# Plugin 配置项

```ts
const Node = Node.create({
  addProseMirrorPlugins() {
    return new Plugin({
      key: new PluginKey('test-plugin'),
      // 保存插件自己的状态
      state:{
        // 初始化
        init(){
          return {
            user:'xxx'
          }
        }
        apply(){}


      }
    })
  },
})
```
