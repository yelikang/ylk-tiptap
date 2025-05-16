const removeWhitespaces = (node: HTMLElement) => {
  const children = node.childNodes

  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i]

    // 如果节点是文本节点，(包含换行符加两个空格的节点\n | 只包含换行符的节点\n )，则删除节点
    if (child.nodeType === 3 && child.nodeValue && /^(\n\s\s|\n)$/.test(child.nodeValue)) {
      node.removeChild(child)
    } else if (child.nodeType === 1) {
      // 如果节点是元素节点(p/span/div...)，则递归删除子节点
      removeWhitespaces(child as HTMLElement)
    }
  }

  return node
}

/**
 * 从字符串转换为element元素
 * @param value 字符串
 * @returns element元素
 */
export function elementFromString(value: string): HTMLElement {
  // add a wrapper to preserve leading and trailing whitespace
  const wrappedValue = `<body>${value}</body>`

  const html = new window.DOMParser().parseFromString(wrappedValue, 'text/html').body

  return removeWhitespaces(html)
}
