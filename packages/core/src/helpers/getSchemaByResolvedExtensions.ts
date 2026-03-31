import {
  MarkSpec, NodeSpec, Schema, TagParseRule,
} from '@tiptap/pm/model'

import { Editor, MarkConfig, NodeConfig } from '../index.js'
import { AnyConfig, Extensions } from '../types.js'
import { callOrReturn } from '../utilities/callOrReturn.js'
import { isEmptyObject } from '../utilities/isEmptyObject.js'
import { getAttributesFromExtensions } from './getAttributesFromExtensions.js'
import { getExtensionField } from './getExtensionField.js'
import { getRenderedAttributes } from './getRenderedAttributes.js'
import { injectExtensionAttributesToParseRule } from './injectExtensionAttributesToParseRule.js'
import { splitExtensions } from './splitExtensions.js'

function cleanUpSchemaItem<T>(data: T) {
  return Object.fromEntries(
    // @ts-ignore
    Object.entries(data).filter(([key, value]) => {
      if (key === 'attrs' && isEmptyObject(value as object | undefined)) {
        return false
      }

      return value !== null && value !== undefined
    }),
  ) as T
}

/**
 * Creates a new Prosemirror schema based on the given extensions.
 * @param extensions An array of Tiptap extensions
 * @param editor The editor instance
 * @returns A Prosemirror schema
 */
export function getSchemaByResolvedExtensions(extensions: Extensions, editor?: Editor): Schema {
  // 获取每个extension定义的全局属性addGlobalAttributes、自身属性addAttributes；用于构建schema的attrs属性；在HTML解析的时候进行注入
  const allAttributes = getAttributesFromExtensions(extensions)
  // 拆分扩展，区分extension、node、mark
  const { nodeExtensions, markExtensions } = splitExtensions(extensions)
  const topNode = nodeExtensions.find(extension => getExtensionField(extension, 'topNode'))?.name

  const nodes = Object.fromEntries(
    nodeExtensions.map(extension => {
      // 从所有Extension中获取的addGlobalAttributes中，根据其中定义的type与当前extension的name进行匹配；代表这个全局属性可以作用在这个类型的Extension Node上
      const extensionAttributes = allAttributes.filter(
        attribute => attribute.type === extension.name,
      )
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor,
      }
      // 通过extendNodeSchema扩展NodeSpec，添加自定义属性(例如:table中申明tableRole,然后通过extendNodeSchema将其拓展到NodeSpec上)
      // “跨扩展”地扩展：在A extension中声明了extendNodeSchema以及其对应的属性；在B扩展中只声明相应的属性，没有extendNodeSchema，该属性也会同步（注入）到 B的NodeSpec
      // 因为: 执行extendNodeSchema时传入的是当前的extension（比如执行table的extendNodeSchema时，传入的是当前的extension；所以会获取当前extension的tableRole）
      const extraNodeFields = extensions.reduce((fields, e) => {
        const extendNodeSchema = getExtensionField<AnyConfig['extendNodeSchema']>(
          e,
          'extendNodeSchema',
          context,
        )

        return {
          ...fields,
          ...(extendNodeSchema ? extendNodeSchema(extension) : {}),
        }
      }, {})

      // 获取node extension各类属性，构建schema
      const schema: NodeSpec = cleanUpSchemaItem({
        ...extraNodeFields,
        content: callOrReturn(
          getExtensionField<NodeConfig['content']>(extension, 'content', context),
        ),
        marks: callOrReturn(getExtensionField<NodeConfig['marks']>(extension, 'marks', context)),
        group: callOrReturn(getExtensionField<NodeConfig['group']>(extension, 'group', context)),
        inline: callOrReturn(getExtensionField<NodeConfig['inline']>(extension, 'inline', context)),
        atom: callOrReturn(getExtensionField<NodeConfig['atom']>(extension, 'atom', context)),
        selectable: callOrReturn(
          getExtensionField<NodeConfig['selectable']>(extension, 'selectable', context),
        ),
        draggable: callOrReturn(
          getExtensionField<NodeConfig['draggable']>(extension, 'draggable', context),
        ),
        code: callOrReturn(getExtensionField<NodeConfig['code']>(extension, 'code', context)),
        whitespace: callOrReturn(getExtensionField<NodeConfig['whitespace']>(extension, 'whitespace', context)),
        linebreakReplacement: callOrReturn(getExtensionField<NodeConfig['linebreakReplacement']>(extension, 'linebreakReplacement', context)),
        defining: callOrReturn(
          getExtensionField<NodeConfig['defining']>(extension, 'defining', context),
        ),
        isolating: callOrReturn(
          getExtensionField<NodeConfig['isolating']>(extension, 'isolating', context),
        ),
        attrs: Object.fromEntries(
          extensionAttributes.map(extensionAttribute => {
            return [extensionAttribute.name, { default: extensionAttribute?.attribute?.default }]
          }),
        ),
      })

      // 获取(getExtensionField)、并执行(callOrReturn)，获取parseHTML
      const parseHTML = callOrReturn(
        getExtensionField<NodeConfig['parseHTML']>(extension, 'parseHTML', context),
      )

      if (parseHTML) {
        schema.parseDOM = parseHTML.map(parseRule => injectExtensionAttributesToParseRule(parseRule, extensionAttributes)) as TagParseRule[]
      }

      // 获取renderHTML方法
      const renderHTML = getExtensionField<NodeConfig['renderHTML']>(
        extension,
        'renderHTML',
        context,
      )

      if (renderHTML) {
        // 转换为DOM，调用对应node的renderHTML方法
        schema.toDOM = node => {
          // 这里被调用，是在prosemirror中的viewdesc/NodeViewDesc/ DOMSerializer.renderSpec

          return renderHTML({
            node,
            HTMLAttributes: getRenderedAttributes(node, extensionAttributes),
          })
        }
      }

      const renderText = getExtensionField<NodeConfig['renderText']>(
        extension,
        'renderText',
        context,
      )

      if (renderText) {
        schema.toText = renderText
      }

      return [extension.name, schema]
    }),
  )

  const marks = Object.fromEntries(
    markExtensions.map(extension => {
      const extensionAttributes = allAttributes.filter(
        attribute => attribute.type === extension.name,
      )
      const context = {
        name: extension.name,
        options: extension.options,
        storage: extension.storage,
        editor,
      }

      const extraMarkFields = extensions.reduce((fields, e) => {
        const extendMarkSchema = getExtensionField<AnyConfig['extendMarkSchema']>(
          e,
          'extendMarkSchema',
          context,
        )

        return {
          ...fields,
          ...(extendMarkSchema ? extendMarkSchema(extension as any) : {}),
        }
      }, {})

      const schema: MarkSpec = cleanUpSchemaItem({
        ...extraMarkFields,
        inclusive: callOrReturn(
          getExtensionField<MarkConfig['inclusive']>(extension, 'inclusive', context),
        ),
        excludes: callOrReturn(
          getExtensionField<MarkConfig['excludes']>(extension, 'excludes', context),
        ),
        group: callOrReturn(getExtensionField<MarkConfig['group']>(extension, 'group', context)),
        spanning: callOrReturn(
          getExtensionField<MarkConfig['spanning']>(extension, 'spanning', context),
        ),
        code: callOrReturn(getExtensionField<MarkConfig['code']>(extension, 'code', context)),
        attrs: Object.fromEntries(
          extensionAttributes.map(extensionAttribute => {
            return [extensionAttribute.name, { default: extensionAttribute?.attribute?.default }]
          }),
        ),
      })

      const parseHTML = callOrReturn(
        getExtensionField<MarkConfig['parseHTML']>(extension, 'parseHTML', context),
      )

      if (parseHTML) {
        schema.parseDOM = parseHTML.map(parseRule => injectExtensionAttributesToParseRule(parseRule, extensionAttributes))
      }

      const renderHTML = getExtensionField<MarkConfig['renderHTML']>(
        extension,
        'renderHTML',
        context,
      )

      if (renderHTML) {
        schema.toDOM = mark => renderHTML({
          mark,
          HTMLAttributes: getRenderedAttributes(mark, extensionAttributes),
        })
      }

      return [extension.name, schema]
    }),
  )

  // 构建Schema对象（包含nodes、marks、topNode）
  // 传递进去的nodes、marks不是Node、mark对象，会在promisemirror中通过 NodeType.compile、MarkType.compile 转换为NodeType、MarkType对象
  // 最后形成  schema:{nodes: {custom-mention: NodeType}, marks: {}} 对象
  // NodeType的spec中会携带这里组装的node schema的原始数据
  return new Schema({
    topNode,
    nodes,
    marks,
  })
}
