import { Node } from '@tiptap/core'
import createMentionPlugin from './prosemirror-mention-plugin'

export interface MentionOptions {
  char: string
}

const Mention = Node.create({
  name: 'custom-mention',
  priority: 1001,
  // 定义所属组别(block块级元素、inline内联元素、text文本元素),content代表该节点的child nodes的类型(content:'inline*')
  group: 'inline',
  // 是否为内联元素(group/inline不能混用，例如：group: 'block', inline: true)
  inline: true,
  addOptions(): MentionOptions {
    return {
      char: '@',
    }
  },
  addAttributes() {
    return {
      color: {
        default: 'red',
        parseHTML: (element) => element.getAttribute('data-color'),
        renderHTML: (attributes) => {
          return {
            'data-color': attributes.color,
          }
        },
      },
    }
  },
  /**
   * 解析 HTML（用于构建rules，匹配使用哪种Node渲染）
   * @returns
   */
  parseHTML() {
    console.log('parseHTML')
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

    console.log('renderHTML', this.options)
    return ['span', { contentEditable: true, 'data-type': this.name }, '123']
  },
  onBlur() {
    console.log('onBlur')
  },

  // // 添加键盘快捷键
  // addKeyboardShortcuts() {
  //   return {
  //     'Mod-@': () => {
  //       // 调用自定义命令
  //       return this.editor.commands.setMention()
  //     },
  //   }
  // },
  // // 添加自定义命令
  // addCommands() {
  //   return {
  //     setMention:
  //       () =>
  //       ({ commands }) => {
  //         return commands.insertContent({ type: this.name })
  //       },
  //   }
  // },
  addProseMirrorPlugins() {
    return [createMentionPlugin(this.editor, this.options)]
  },
})

export default Mention
