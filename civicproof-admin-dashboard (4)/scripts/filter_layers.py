import json

with open('c:/Namma Ooru/civicproof-admin-dashboard (4)/public/style_layers.json', 'r') as f:
    layers = json.load(f)

print(f"Total layers: {len(layers)}")
for l in layers:
    lid = l['id']
    if any(k in lid for k in ['water', 'road', 'park', 'landcover', 'landuse', 'background', 'railway', 'building']):
        print(f"{lid} ({l['type']}): {l.get('source-layer', '')}")
