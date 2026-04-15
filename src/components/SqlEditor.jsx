import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'

/**
 * SqlEditor — Monaco-powered SQL code editor.
 *
 * Uses a custom "speedsql" theme that maps directly to the design-system tokens:
 *   • Background : #0b1326  (surface-dim)
 *   • Foreground : #dae2fd  (on-surface)
 *   • Keywords   : #d8e3fb  (tertiary)
 *   • Strings    : #9dacc2  (secondary-fixed-dim)
 *   • Comments   : #474747  (outline-variant)
 *   • Active line: #131b2e  (surface-container-low)
 *
 * @param {{
 *   value:      string,
 *   onChange:   (v: string) => void,
 *   questionId: string | number | null,  // change triggers a hard clear
 * }} props
 */
export default function SqlEditor({ value, onChange, questionId = null }) {
  /**
   * editorRef lets us call Monaco's imperative API directly.
   * We use editor.setValue('') on question change rather than relying on
   * the controlled `value` prop alone — Monaco's internal diffing can
   * occasionally skip an update when the incoming value is an empty string.
   */
  const editorRef = useRef(null)

  /**
   * When questionId changes (new question loaded), wipe the editor content
   * and notify the parent so its sql state stays in sync.
   * Skips the very first render (editorRef not populated yet at that point;
   * the editor mounts empty anyway via value='').
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue('')
      onChange?.('')
    }
    // questionId is the only trigger; onChange is stable (passed from GameScreen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId])

  function handleMount(editor, monaco) {
    editorRef.current = editor
    // ── Define SpeedSQL dark theme ──
    monaco.editor.defineTheme('speedsql', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // SQL keywords → tertiary (#d8e3fb atmospheric blue)
        { token: 'keyword',              foreground: 'd8e3fb', fontStyle: '' },
        { token: 'keyword.sql',          foreground: 'd8e3fb' },
        // Strings & numbers → secondary-fixed-dim (#9dacc2 muted slate)
        { token: 'string',               foreground: '9dacc2' },
        { token: 'string.sql',           foreground: '9dacc2' },
        { token: 'number',               foreground: '9dacc2' },
        // Comments → outline-variant (#474747 ghost)
        { token: 'comment',              foreground: '474747', fontStyle: 'italic' },
        { token: 'comment.sql',          foreground: '474747', fontStyle: 'italic' },
        // Operators → secondary (#b9c8de)
        { token: 'operator',             foreground: 'b9c8de' },
        // Identifiers → on-surface (#dae2fd at 90%)
        { token: 'identifier',           foreground: 'dae2fd' },
        { token: 'identifier.sql',       foreground: 'dae2fd' },
        // Type names
        { token: 'type',                 foreground: 'b9c8de' },
      ],
      colors: {
        // Surfaces
        'editor.background':                    '#0b1326',
        'editor.foreground':                    '#dae2fd',
        // Gutter
        'editorLineNumber.foreground':          '#2d3449',
        'editorLineNumber.activeForeground':    '#b9c8de',
        'editorGutter.background':              '#0d1628',
        // Active line
        'editor.lineHighlightBackground':       '#131b2e',
        'editor.lineHighlightBorder':           '#00000000',
        // Selection
        'editor.selectionBackground':           '#2d344960',
        'editor.inactiveSelectionBackground':   '#2d344930',
        // Cursor
        'editorCursor.foreground':              '#ffffff',
        // Indent guides
        'editorIndentGuide.background':         '#171f3340',
        'editorIndentGuide.activeBackground':   '#2d344960',
        // Scrollbar
        'scrollbarSlider.background':           '#47474740',
        'scrollbarSlider.hoverBackground':      '#47474780',
        'scrollbarSlider.activeBackground':     '#474747b0',
        // Bracket matching
        'editorBracketMatch.background':        '#2d344960',
        'editorBracketMatch.border':            '#b9c8de50',
        // Widget backgrounds (autocomplete, hover, etc.)
        'editorWidget.background':              '#171f33',
        'editorWidget.border':                  '#47474730',
        'editorSuggestWidget.background':       '#171f33',
        'editorSuggestWidget.border':           '#47474730',
        'editorSuggestWidget.selectedBackground':'#2d3449',
        'editorHoverWidget.background':         '#171f33',
        'editorHoverWidget.border':             '#47474730',
        // Overview ruler
        'editorOverviewRuler.border':           '#00000000',
      },
    })
    monaco.editor.setTheme('speedsql')
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="sql"
      defaultValue=""
      value={value}
      onChange={onChange}
      onMount={handleMount}
      loading={
        <div className="flex items-center justify-center h-full bg-surface-dim text-secondary text-xs font-display uppercase tracking-widest">
          Loading editor…
        </div>
      }
      options={{
        // Typography
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        lineHeight: 22,
        // Layout
        padding: { top: 16, bottom: 16 },
        lineNumbersMinChars: 3,
        glyphMargin: false,
        folding: false,
        // Behaviour
        minimap:              { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling:      true,
        cursorBlinking:       'blink',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight:  'line',
        // Scrollbars — 4 px to match design system
        scrollbar: {
          verticalScrollbarSize:   4,
          horizontalScrollbarSize: 4,
          useShadows:              false,
        },
        // Overview ruler (right gutter) — hide
        overviewRulerLanes:           0,
        hideCursorInOverviewRuler:    true,
        overviewRulerBorder:          false,
        // Word wrap
        wordWrap: 'off',
      }}
    />
  )
}
