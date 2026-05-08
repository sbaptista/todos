'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { OrbResponse } from '@/app/actions/orb-converse'

export type ConversationMessage = {
    id: string
    type: 'user' | 'orb'
    text: string
    results?: OrbResponse['results']
    queryLabel?: string
    isStreaming?: boolean
    thoughts?: string[]
}

type Props = {
    messages: ConversationMessage[]
    input: string
    submitting: boolean
    productCode: string
    products: { code: string | null; name: string }[]
    scopeToProduct: boolean
    onInputChange: (v: string) => void
    onSubmit: (value: string) => void
    onShowResults: (results: NonNullable<OrbResponse['results']>, label: string) => void
    onScopeChange: (v: boolean) => void
}

export default function OrbConversation({
    messages,
    input,
    submitting,
    productCode,
    products,
    scopeToProduct,
    onInputChange,
    onSubmit,
    onShowResults,
    onScopeChange,
}: Props) {
    const threadRef             = useRef<HTMLDivElement>(null)
    const textareaRef           = useRef<HTMLTextAreaElement>(null)
    const slashMenuDismissed    = useRef(false)
    const [inputFocused, setInputFocused] = useState(false)
    const [copiedResponse, setCopiedResponse] = useState(false)
    const [copiedInput, setCopiedInput] = useState(false)

    // Command History
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState<number>(-1)

    const [slashIndex, setSlashIndex] = useState(0)

    const SLASH_COMMANDS = [
        { cmd: '/switch [project]', desc: 'e.g. [project]' },
        { cmd: '/edit', desc: 'Edit current project' },
        { cmd: '/edit [project]', desc: 'Switch and edit' },
        { cmd: '/settings', desc: 'Open settings panel' },
        { cmd: '/help', desc: 'Show help overlay' },
        { cmd: '/orb', desc: 'What can the orb do?' },
    ]

    const activeSlashCommands = SLASH_COMMANDS.filter(c => c.cmd.toLowerCase().startsWith(input.toLowerCase()))
    const showSlashMenu = inputFocused && input.startsWith('/') && activeSlashCommands.length > 0 && historyIndex === -1 && !slashMenuDismissed.current

    function fillCommand(cmd: string) {
        slashMenuDismissed.current = true
        onInputChange(cmd)
        setSlashIndex(0)
        const idx = cmd.indexOf('[project]')
        if (idx !== -1) {
            setTimeout(() => {
                const el = textareaRef.current
                if (!el) return
                el.focus()
                el.setSelectionRange(idx, idx + '[project]'.length)
            }, 0)
        }
    }


    useEffect(() => {
        const saved = sessionStorage.getItem('todos_orb_cmd_hist')
        if (saved) {
            try { setHistory(JSON.parse(saved)) } catch {}
        }
    }, [])

    function handleHistoryUp() {
        if (history.length === 0) return
        const newIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIdx)
        onInputChange(history[newIdx])
    }

    function handleHistoryDown() {
        if (historyIndex === -1) return
        const newIdx = historyIndex + 1
        if (newIdx >= history.length) {
            setHistoryIndex(-1)
            onInputChange('')
        } else {
            setHistoryIndex(newIdx)
            onInputChange(history[newIdx])
        }
    }

    function copyToClipboard(text: string, which: 'response' | 'input') {
        navigator.clipboard.writeText(text).then(() => {
            if (which === 'response') {
                setCopiedResponse(true)
                setTimeout(() => setCopiedResponse(false), 1500)
            } else {
                setCopiedInput(true)
                setTimeout(() => setCopiedInput(false), 1500)
            }
        })
    }

    const autoResize = useCallback(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        const h = Math.min(el.scrollHeight, 160)
        el.style.height = `${h}px`
        el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden'
    }, [])

    useEffect(() => { autoResize() }, [input, autoResize])

    const handleFormSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        const value = (textareaRef.current?.value ?? input).trim()
        if (!value || submitting) return

        const newHist = [...history]
        if (newHist[newHist.length - 1] !== value) {
            newHist.push(value)
            setHistory(newHist)
            sessionStorage.setItem('todos_orb_cmd_hist', JSON.stringify(newHist))
        }
        setHistoryIndex(-1)

        onSubmit(value)
    }

    const lastOrbMessage = [...messages].reverse().find(m => m.type === 'orb')
    const hasMessages = !!lastOrbMessage

    return (
        <div style={{
            position: 'relative' as const,
            zIndex: 1,
            width: '420px',
            maxWidth: '90vw',
            background: '#fff',
            border: `1px solid ${inputFocused ? 'var(--border-focus)' : 'rgba(0,0,0,0.08)'}`,
            borderRadius: 'var(--r-xl)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
            transition: 'border-color 0.15s',
        }}>

            {hasMessages && (
                <div
                    ref={threadRef}
                    aria-live="polite"
                    style={{
                        padding: '16px 20px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        animation: 'todos-fade-in 0.3s ease-out',
                    }}
                >
                    <div style={{ lineHeight: 1.5 }}>
                        <div>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    fontFamily: 'var(--font-ui)',
                                    fontSize: 'var(--fs-sm)',
                                    fontWeight: 600,
                                    color: 'var(--text)',
                                    letterSpacing: '0.02em',
                                }}>
                                    Orb:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(lastOrbMessage.text, 'response')}
                                    title="Copy response"
                                    aria-label="Copy response"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: copiedResponse ? 'var(--pill-active-color)' : 'var(--muted)',
                                        padding: '2px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s',
                                        opacity: 0.7,
                                    }}
                                >
                                    {copiedResponse ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                        </svg>
                                    )}
                                </button>
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                {lastOrbMessage.thoughts && lastOrbMessage.thoughts.length > 0 && (
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '4px',
                                        opacity: 0.6
                                    }}>
                                        {lastOrbMessage.thoughts.map((thought, i) => (
                                            <div key={i} style={{
                                                fontSize: 'var(--fs-xs)',
                                                color: 'var(--text3)',
                                                fontFamily: 'var(--font-ui)',
                                                letterSpacing: '0.02em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                animation: 'todos-thought-fade-in 0.4s ease-out forwards'
                                            }}>
                                                <span style={{ color: 'var(--pill-active-color)', fontSize: '10px' }}>●</span>
                                                {thought}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <span style={{
                                    fontFamily: 'var(--font-ui)',
                                    fontSize: 'var(--fs-base)',
                                    color: 'var(--text2)',
                                    whiteSpace: 'pre-wrap',
                                    opacity: lastOrbMessage.isStreaming ? 0.8 : 1,
                                    transition: 'opacity 0.2s',
                                }}>
                                    {lastOrbMessage.text}
                                    {lastOrbMessage.isStreaming && (
                                        <span style={{
                                            display: 'inline-block',
                                            width: '4px',
                                            height: '14px',
                                            background: 'var(--pill-active-bg)',
                                            marginLeft: '4px',
                                            verticalAlign: 'middle',
                                            animation: 'todos-cursor-blink 0.8s infinite'
                                        }} />
                                    )}
                                </span>
                            </div>
                            {lastOrbMessage.results && lastOrbMessage.results.length > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    <button
                                        onClick={() => onShowResults(lastOrbMessage.results!, lastOrbMessage.queryLabel ?? '')}
                                        title="Show query results"
                                        style={{
                                            fontFamily: 'var(--font-ui)',
                                            fontSize: 'var(--fs-xs)',
                                            fontWeight: 500,
                                            letterSpacing: '0.06em',
                                            padding: '5px 14px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--pill-active-border)',
                                            color: 'var(--pill-active-color)',
                                            background: 'var(--pill-active-bg)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Show list · {lastOrbMessage.results.length}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {hasMessages && (
                <div style={{ height: '1px', background: 'var(--border)', flexShrink: 0 }} />
            )}

            <form onSubmit={handleFormSubmit} style={{ position: 'relative' }}>
                {!input && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '13px',
                            left: '20px',
                            pointerEvents: 'none',
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--fs-input)',
                            color: 'var(--muted)',
                            lineHeight: 1.5,
                            zIndex: 1,
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Type ? or / for help.
                    </div>
                )}
                
                {showSlashMenu && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '16px',
                        marginBottom: '8px',
                        background: 'var(--bg)',
                        border: '1.5px solid rgba(60,110,60,0.35)',
                        borderRadius: '6px',
                        boxShadow: 'var(--shadow-md)',
                        padding: '4px',
                        zIndex: 50,
                        minWidth: '200px',
                    }}>
                        {activeSlashCommands.map((c, i) => (
                            <div
                                key={c.cmd}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    background: slashIndex === i ? 'var(--bg2)' : 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    fillCommand(c.cmd)
                                }}
                            >
                                <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--text)', fontWeight: slashIndex === i ? 600 : 400 }}>{c.cmd}</span>
                                <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{c.desc}</span>
                            </div>
                        ))}
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={e => { slashMenuDismissed.current = false; onInputChange(e.target.value); autoResize() }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if (showSlashMenu && activeSlashCommands[slashIndex]) {
                                fillCommand(activeSlashCommands[slashIndex].cmd)
                            } else {
                                handleFormSubmit()
                            }
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            if (showSlashMenu) {
                                setSlashIndex(prev => Math.max(0, prev - 1))
                            } else {
                                handleHistoryUp()
                            }
                        } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            if (showSlashMenu) {
                                setSlashIndex(prev => Math.min(activeSlashCommands.length - 1, prev + 1))
                            } else {
                                handleHistoryDown()
                            }
                        } else if (e.key === 'Escape') {
                            if (showSlashMenu) {
                                onInputChange('')
                            }
                        }
                    }}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    disabled={submitting}
                    style={{
                        width: '100%',
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--fs-input)',
                        background: 'transparent',
                        border: 'none',
                        padding: '12px 20px',
                        color: 'var(--text)',
                        outline: 'none',
                        resize: 'none',
                        lineHeight: 1.5,
                        overflowY: 'hidden',
                        boxSizing: 'border-box',
                    }}
                />

                {/* Pill strip */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 16px 10px',
                }}>
                    {/* Scope pill */}
                    <button
                        type="button"
                        onClick={() => onScopeChange(!scopeToProduct)}
                        onMouseDown={(e) => e.preventDefault()}
                        title={scopeToProduct ? 'Search all projects' : 'Search current project only'}
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 500,
                            letterSpacing: '0.06em',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: `1.5px solid ${!scopeToProduct ? 'var(--pill-active-border)' : 'rgba(60,110,60,0.35)'}`,
                            color: !scopeToProduct ? 'var(--pill-active-color)' : 'var(--muted)',
                            background: !scopeToProduct ? 'var(--pill-active-bg)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all var(--transition)',
                        }}
                    >
                        All
                    </button>

                    <div style={{ flex: 1 }} />

                    {/* History nav pills */}
                    <button
                        type="button"
                        onClick={handleHistoryUp}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={history.length === 0}
                        title="Previous command"
                        aria-label="Previous command"
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(60,110,60,0.35)',
                            color: 'var(--muted)',
                            background: 'transparent',
                            cursor: history.length === 0 ? 'default' : 'pointer',
                            opacity: history.length === 0 ? 0.35 : 1,
                            transition: 'all var(--transition)',
                        }}
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={handleHistoryDown}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={historyIndex === -1}
                        title="Next command"
                        aria-label="Next command"
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(60,110,60,0.35)',
                            color: 'var(--muted)',
                            background: 'transparent',
                            cursor: historyIndex === -1 ? 'default' : 'pointer',
                            opacity: historyIndex === -1 ? 0.35 : 1,
                            transition: 'all var(--transition)',
                        }}
                    >
                        ↓
                    </button>

                    {/* Copy input pill */}
                    <button
                        type="button"
                        onClick={() => input.trim() && copyToClipboard(input, 'input')}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={!input.trim()}
                        title="Copy input"
                        aria-label="Copy input"
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(60,110,60,0.35)',
                            color: copiedInput ? 'var(--pill-active-color)' : 'var(--muted)',
                            background: copiedInput ? 'var(--pill-active-bg)' : 'transparent',
                            cursor: input.trim() ? 'pointer' : 'default',
                            opacity: input.trim() ? 1 : 0.35,
                            transition: 'all var(--transition)',
                        }}
                    >
                        {copiedInput ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        )}
                    </button>

                    {/* Submit pill */}
                    <button
                        type="submit"
                        disabled={!input.trim() || submitting}
                        title="Submit"
                        aria-label="Submit"
                        style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: 'var(--fs-xs)',
                            fontWeight: 500,
                            letterSpacing: '0.06em',
                            padding: '3px 12px',
                            borderRadius: '12px',
                            border: `1.5px solid ${input.trim() ? 'var(--pill-active-border)' : 'rgba(60,110,60,0.35)'}`,
                            color: input.trim() ? 'var(--pill-active-color)' : 'var(--muted)',
                            background: input.trim() ? 'var(--pill-active-bg)' : 'transparent',
                            cursor: input.trim() ? 'pointer' : 'default',
                            transition: 'all var(--transition)',
                        }}
                    >
                        ↵
                    </button>
                </div>
            </form>
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes todos-fade-in {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes todos-cursor-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes todos-thought-fade-in {
                    from { opacity: 0; transform: translateX(-4px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}} />
        </div>
    )
}
