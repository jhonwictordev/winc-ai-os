import sqlite3

conn = sqlite3.connect(r'C:\Users\winc\.gemini\antigravity\scratch\winc-ai-os\storage\winc_ai_os.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cur.execute("""
    SELECT id, name, name_pt, division_label_pt, description_pt 
    FROM agents 
    WHERE id LIKE '%pdf%' OR id LIKE '%godot%' OR id LIKE '%unity%' OR id LIKE '%unreal%' OR id LIKE '%content-creator%'
""")
for r in cur.fetchall():
    print(f"{r['id']} | {r['name']} -> {r['name_pt']} | {r['division_label_pt']}")
    print(f"  Desc: {r['description_pt'][:100]}...\n")
