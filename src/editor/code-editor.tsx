import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { useEffect, useLayoutEffect, useRef } from 'react'

// Editor do corpo da nota (CodeMirror 6, VO-DEC001) com os tokens do VO-DS001.
const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--vy-panel)',
    color: 'var(--vy-strong)',
    border: '1px solid var(--vy-line)',
    fontSize: '13px',
  },
  '&.cm-focused': { outline: '2px solid var(--vy-nasa)', outlineOffset: '0' },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.7',
    padding: '16px 0',
    caretColor: 'var(--vy-nasa)',
  },
  '.cm-line': { padding: '0 18px' },
  '.cm-scroller': { minHeight: '420px' },
  '.cm-cursor': { borderLeftColor: 'var(--vy-nasa)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--vy-orbit)',
  },
  '.cm-placeholder': { color: 'var(--vy-faint)' },
})

export interface CodeEditorHandle {
  insert: (text: string) => void
}

export default function CodeEditor({
  value,
  onChange,
  onReady,
  label,
}: {
  value: string
  onChange: (value: string) => void
  onReady?: (handle: CodeEditorHandle) => void
  label: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const change = useRef(onChange)
  useLayoutEffect(() => {
    change.current = onChange
  }, [onChange])

  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
          markdown(),
          EditorView.lineWrapping,
          placeholder('Conteúdo da nota em Markdown'),
          theme,
          EditorView.contentAttributes.of({ 'aria-label': label, 'data-testid': 'editor-content' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) change.current(u.state.doc.toString())
          }),
        ],
      }),
    })
    onReady?.({
      insert: (text) => {
        const { from, to } = view.state.selection.main
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        })
        view.focus()
      },
    })
    view.focus()
    return () => view.destroy()
    // o documento inicial é lido uma vez; depois o editor é a fonte do rascunho
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={host} data-testid="editor" />
}
