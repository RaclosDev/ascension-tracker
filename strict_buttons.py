import re

path = 'frontend/src/pages/UtilitiesPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Camera button styling
text = text.replace("""                      style={{
                        borderRadius: '50%',
                        minWidth: '42px', width: '42px',
                        minHeight: '42px', height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1C1C1E',
                        color: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                      }}""",
"""                      style={{
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-medium)',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}""")

text = text.replace('<Camera size={20} color="#FFFFFF" />', '<Camera size={16} />')

# Replace Mic button styling
text = text.replace("""                      style={{
                        borderRadius: '50%',
                        minWidth: '42px', width: '42px',
                        minHeight: '42px', height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isListening ? 'rgba(239,68,68,0.2)' : '#1C1C1E',
                        color: isListening ? '#ef4444' : '#FFFFFF',
                        border: isListening ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        flexShrink: 0,
                      }}""",
"""                      style={{
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                        color: isListening ? '#ef4444' : 'var(--text-primary)',
                        border: isListening ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}""")

text = text.replace('{isListening ? <Square size={20} color="#FFFFFF" /> : <Mic size={20} color="#FFFFFF" />}', '{isListening ? <Square size={16} /> : <Mic size={16} />}')


with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Applied strict 34px standard button style")
