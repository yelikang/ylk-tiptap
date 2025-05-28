import { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { MentionOptions } from './mention'
import { findMatch } from './findMatch'
import MentionRender from './mention-panel.vue'
import { h, render } from 'vue'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import tippy from 'tippy.js'

const createMentionPlugin = (_editor: Editor, _options: MentionOptions) => {
  let renderVnode = null
  let container = null
  let popup = null

  return new Plugin({
    key: new PluginKey('mention'),
    view() {
      return {
        // 任何变动都会触发update
        update: (view, prevState) => {
          const prev = this.key?.getState(prevState)
          const next = this.key?.getState(view.state)

          if (next.showPanel) {
            if (!renderVnode) {
              renderVnode = h(MentionRender, {
                props: {
                  query: next.query,
                },
              })
              container = document.createElement('div')
              render(renderVnode, container)
            } else {
              renderVnode.component.props.query = next.query
            }

            if (!popup) {
              popup = tippy('body', {
                getReferenceClientRect: () => {
                  return _editor.view.dom
                    .querySelector(`[data-decoration-id="${next.decorationId}"]`)
                    .getBoundingClientRect()
                },
                appendTo: () => document.body,
                content: container,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            } else {
              popup[0].show()
            }
          } else {
            popup?.[0]?.destroy()
            popup = null
          }
        },
        destroy() {
          if (renderVnode) {
            render(null, container)
            container.remove()
            container = null
            renderVnode = null
            popup[0].destroy()
            popup = null
          }
        },
      }
    },
    state: {
      init() {
        return {
          showPanel: false,
          query: '',
          range: { from: 0, to: 0 },
          decorationId: '',
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

          const decorationId = `id_${Math.floor(Math.random() * 0xffffffff)}`

          if (match !== null) {
            next.showPanel = true
            next.query = match.query
            next.range = match.range
            next.decorationId = decorationId
          } else {
            next.showPanel = false
            next.query = ''
            next.range = { from: 0, to: 0 }
            next.decorationId = null
          }
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

      decorations(state) {
        const { range, showPanel, decorationId } = this.getState(state)
        if (!showPanel) {
          return null
        }

        return DecorationSet.create(state.doc, [
          Decoration.inline(range.from, range.to, {
            nodeName: 'span',
            'data-decoration-id': decorationId,
          }),
        ])
      },
    },
  })
}

export default createMentionPlugin
