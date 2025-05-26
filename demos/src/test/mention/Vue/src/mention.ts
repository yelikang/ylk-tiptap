import { Node } from '@tiptap/core'

const Mention = Node.create({
  name: 'custom-mention',
  priority: 1001,
  // 定义所属组别(block块级元素、inline内联元素、text文本元素)
  group: 'inline',
  // 是否为内联元素(group/inline不能混用，例如：group: 'block', inline: true)
  inline: true,
  addOptions() {
    return {
      userInfo: {
        age: 12,
        sex: '',
      },
    }
  },
  /**
   * 解析 HTML（用于构建rules，匹配使用哪种Node渲染）
   * @returns
   */
  parseHTML() {
    return [
      {
        // 会使用dom.matches(选择器)方法，与tag进行匹配
        tag: 'span[data-type="mention"]',
      },
    ]
  },
  renderHTML() {
    // prosemirror-model的renderSpec，会根据返回的不同结构（string, DOMNode, 数组...），构建不同的DOM元素
    //  structure[0]为元素名、structure[1]为元素的属性、structure[2]为子元素内容（例如：['code', { 'data-type': this.name },['span']]）
    // return ['code', { 'data-type': this.name }, '']


    console.log('options===', this.options)

    return ['span', '123']
  },
  // renderText() {
  //   return 'mention'
  // },
})

export default Mention
