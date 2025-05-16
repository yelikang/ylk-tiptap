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
    return ['code', { 'data-type': this.name }, '']
  },
  renderText() {
    return 'mention'
  },
})

export default Mention
