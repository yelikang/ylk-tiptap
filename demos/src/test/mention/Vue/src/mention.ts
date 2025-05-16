import { Node } from '@tiptap/core'

const Mention = Node.create({
  name: 'custom-mention',
  priority: 1001,
  group: 'block',

  /**
   * 解析 HTML
   * @returns
   */
  parseHTML() {
    return [
      {
        tag: 'p',
      },
    ]
  },
  renderHTML() {
    // prosemirror-model的renderSpec，会根据返回的不同结构（string, DOMNode, 数组...），构建不同的DOM元素
    //  structure[0]为元素名、structure[1]为元素的属性、structure[2]为子元素内容（例如：['code', { 'data-type': this.name },['span']]）
    return ['code', { 'data-type': this.name }, '']
  },
  renderText() {
    return 'mention'
  },
})

export default Mention
