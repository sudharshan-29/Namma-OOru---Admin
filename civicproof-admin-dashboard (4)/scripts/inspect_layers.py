import urllib.request
import json

url = 'https://tiles.openfreemap.org/styles/liberty'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

with open('c:/Namma Ooru/civicproof-admin-dashboard (4)/public/style_layers.json', 'w') as f:
    json.dump([{'id': l['id'], 'type': l['type'], 'source-layer': l.get('source-layer', ''), 'paint': l.get('paint', {})} for l in data['layers']], f, indent=2)

print('Saved style_layers.json successfully')
