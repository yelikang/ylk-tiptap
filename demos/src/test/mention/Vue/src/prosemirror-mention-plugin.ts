import { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { MentionOptions } from './mention'
import { findMatch } from './findMatch'
const createMentionPlugin = (_editor: Editor, _options: MentionOptions) => {
  return new Plugin({
    key: new PluginKey('mention'),
    view() {
      return {
        // 任何变动都会触发update
        update: (view, prevState) => {
          const prev = this.key?.getState(prevState)
          const next = this.key?.getState(view.state)

          if (next.showPanel) {
            console.log('showPanel')
          }
        },
      }
    },
    state: {
      init() {
        return {
          showPanel: false,
        }
      },
      apply(transaction, prev, _oldState, state) {
        // 是否可编辑
        const { isEditable } = _editor
        // 是否输入法编辑
        const { composing } = _editor.view
        // 选区信息(empty:没有选区)
        const { empty, $from } = transaction.selection

        const next = { ...prev }

        if (isEditable && empty) {
          const match = findMatch({
            char: '@',
            $position: $from,
          })
        } else {
          next.showPanel = false
        }

        // 根据关键字触发状态更新

        return next
      },
    },

    // props中处理外部的逻辑
    props: {
      // 例如编辑器中键盘按下，外部要做一些处理
      handleKeyDown(view, event) {
        return false
      },
    },
  })
}

export default createMentionPlugin
