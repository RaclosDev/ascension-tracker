import re
import os

path_utils = 'frontend/src/pages/UtilitiesPage.tsx'
with open(path_utils, 'r', encoding='utf-8') as f:
    text_utils = f.read()

# 1. Imports
text_utils = text_utils.replace("import { Camera, Mic, Square } from 'lucide-react';", "import { Camera, Mic, Square, Bot, User } from 'lucide-react';")

# 2. Camera and Mic explicit colors
text_utils = text_utils.replace('<Camera size={20} />', '<Camera size={20} color="#FFFFFF" />')
text_utils = text_utils.replace('<Square size={20} />', '<Square size={20} color="#FFFFFF" />')
text_utils = text_utils.replace('<Mic size={20} />', '<Mic size={20} color="#FFFFFF" />')

# 3. Header Sparkle
header_svg = """<svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>"""
text_utils = text_utils.replace(header_svg, '<Bot size={20} color="#FFFFFF" />')

# 4. Chat Avatars
# Replace user avatar
user_svg = """<svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>"""
text_utils = text_utils.replace(user_svg, '<User size={18} />')

ai_svg = """<svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                          </svg>"""
text_utils = text_utils.replace(ai_svg, '<Bot size={18} color="var(--accent-primary)" />')

# Loading AI avatar
loading_ai_svg = """<svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      </svg>"""
text_utils = text_utils.replace(loading_ai_svg, '<Bot size={18} color="var(--accent-primary)" />')


with open(path_utils, 'w', encoding='utf-8') as f:
    f.write(text_utils)

print("Replaced all correctly")
