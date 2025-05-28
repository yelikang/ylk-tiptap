export interface Trigger {
  char: string
  $position: any
}

export function findMatch(config: Trigger) {
  const { char, $position } = config

  // 光标前面的文本
  const text = $position.nodeBefore?.isText && $position.nodeBefore.text

  if (!text) {
      return null
    }
    console.log('text', text)
}
