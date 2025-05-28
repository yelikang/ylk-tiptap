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

  // [^\s@] 非空格和非@
  // @[^\s@] 以@开头，非空格和非@
  // @[^\s@]* 以@开头，非空格和非@，0个或多个（匹配任意数量的非空白、非@的字符）
  // (?:^)?@[^\s@]*，  (?:^)代表@前面的的内容都不归入捕获组，例如空格

  const regexp = new RegExp(`(?:^)?${char}[^\\s${char}]*`, 'gm')

  // 匹配最后一个
  const match = Array.from(text.matchAll(regexp)).pop()
  if (!match) {
    return null
  }

  // 判断前一个字符是否为空格
  const prevChar = text[match.index - 1]
  const prefixAllowed = new RegExp('\\s', 'gm').test(prevChar)
  if (!prefixAllowed) {
    return null
  }

  // 计算光标是否在匹配的范围内 例如: 123 @456 789，光标在789后面，但是还是能匹配到最后的@456
  // 1. 计算匹配项的起始位置
  // a.文字的起始位置(光标位置 - 文字长度)
  const textFrom = $position.pos - text.length
  // b.匹配项的起始位置(匹配项在text中的位置 + 1)
  const from = textFrom + match.index

  // 2. 结束位置
  const to = from + match[0].length

  // console.log($position.pos, from, to)

  if (from < $position.pos && $position.pos <= to) {
    const query = match[0].slice(char.length)
    // console.log('query', query)
    return {
      query,
      range: { from, to },
    }
  }
  return null
}
