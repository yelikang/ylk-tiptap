<template>
  <div v-if="editor">
    <a @click="getEditorContent">获取内容</a>
    <editor-content :editor="editor" />
  </div>
</template>

<script>
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import { Editor, EditorContent } from '@tiptap/vue-3'
import Color from '@tiptap/extension-color'

import Mention from './src/mention'

// import suggestion from './suggestion.js'

export default {
  components: {
    EditorContent,
  },

  data() {
    return {
      editor: null,
    }
  },

  mounted() {
    this.editor = new Editor({
      extensions: [
        Color,
        Document,
        Paragraph,
        Text,
        Bold,
        Mention.configure({}),
        // Mention.configure({
        //   HTMLAttributes: {
        //     class: 'mention',
        //   },
        //   suggestion,
        // }),
      ],
      content: `
        <p>Hi everyone! Don’t forget the daily stand up at 8 AM.</p>
        <p><span data-type="mention" data-id="Jennifer Grey"></span> Would you mind to share what you’ve been working on lately? We fear not much happened since Dirty Dancing.
      `,
      autofocus: true,
    })
  },

  beforeUnmount() {
    this.editor.destroy()
  },

  methods: {
    getEditorContent() {
      console.log(this.editor.getText())
      console.log(this.editor.getHTML())
    },
  },
}
</script>

<style lang="scss">
/* Basic editor styles */
.tiptap {
  :first-child {
    margin-top: 0;
  }

  .mention {
    background-color: var(--purple-light);
    border-radius: 0.4rem;
    box-decoration-break: clone;
    color: var(--purple);
    padding: 0.1rem 0.3rem;
  }
}
</style>
