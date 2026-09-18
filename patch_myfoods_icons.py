import re

with open('frontend/src/pages/MyFoodsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

lucide_import_pattern = r'import\s+\{[^}]*\}\s+from\s+[\'"]lucide-react[\'"];?'
match = re.search(lucide_import_pattern, content)
new_icons = ["LayoutGrid", "List", "Clock", "ArrowDownAZ", "Utensils", "Trash2", "ScanLine", "Pencil", "Plus", "ChevronDown", "ChevronRight", "X", "Check"]
if match:
    existing_imports = match.group(0)
    for icon in new_icons:
        if icon not in existing_imports:
            existing_imports = existing_imports.replace('{', f'{{ {icon},')
    content = content[:match.start()] + existing_imports + content[match.end():]

content = re.sub(
    r">\s*\{viewMode === 'grid' \? '[^']*' : '[^']*'\}\s*</button>",
    ">{viewMode === 'grid' ? <List className=\"w-4 h-4\" /> : <LayoutGrid className=\"w-4 h-4\" />}</button>",
    content
)

content = re.sub(
    r">\s*\{sortBy === 'recent' \? '[^']*' : '[^']*'\}\s*</button>",
    ">{sortBy === 'recent' ? <ArrowDownAZ className=\"w-4 h-4\" /> : <Clock className=\"w-4 h-4\" />}</button>",
    content
)

content = content.replace("🍽️ Añadir", "<Utensils className=\"w-4 h-4\" /> Añadir")
content = content.replace(" Borrar", " <Trash2 className=\"w-4 h-4\" /> Borrar")

content = content.replace("🖼️ Escanear Etiqueta Nutricional", "<ScanLine className=\"w-5 h-5 mr-2\" /> Escanear Etiqueta Nutricional")
content = content.replace("✍️ Crear Manualmente", "<Pencil className=\"w-5 h-5 mr-2\" /> Crear Manualmente")
content = content.replace("🔄 Escanear otro", "<ScanLine className=\"w-4 h-4 mr-1\" /> Escanear otro")
content = content.replace("🔄 Reintentar", "Reintentar")
content = content.replace("＋ Crear manual", "<Plus className=\"w-4 h-4 mr-1\" /> Crear manual")

content = re.sub(r'\{expandedSections\.foods \? \'[^\']*\' : \'[^\']*\'\}', '{expandedSections.foods ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}', content)
content = re.sub(r'\{expandedSections\.recipes \? \'[^\']*\' : \'[^\']*\'\}', '{expandedSections.recipes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}', content)
content = re.sub(r'\{expandedSections\.recent \? \'[^\']*\' : \'[^\']*\'\}', '{expandedSections.recent ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}', content)

content = re.sub(r'>\s*✕\s*</button>', '><X className="w-4 h-4" /></button>', content)
content = re.sub(r'>\s*✕\s*</span>', '><X className="w-4 h-4" /></span>', content)
content = re.sub(r'>✓</span>', '><Check className="w-3 h-3" /></span>', content)

content = re.sub(
    r'title="Crear o Añadir Alimento"\s*>\s*＋\s*</button>',
    'title="Crear o Añadir Alimento">\n        <Plus className="w-6 h-6" />\n      </button>',
    content
)

with open('frontend/src/pages/MyFoodsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
