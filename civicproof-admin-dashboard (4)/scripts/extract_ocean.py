# pyrefly: ignore[missing-import]
from PIL import Image

img = Image.open('c:/Namma Ooru/civicproof-admin-dashboard (4)/public/ocean_sample.png')
# Crop pure ocean with no labels (x=40..220, y=150..390)
crop = img.crop((40, 150, 220, 390))
crop = crop.resize((256, 256), Image.Resampling.LANCZOS)
crop.save('c:/Namma Ooru/civicproof-admin-dashboard (4)/public/ocean_tile.png')
print('Saved ocean_tile.png 256x256')