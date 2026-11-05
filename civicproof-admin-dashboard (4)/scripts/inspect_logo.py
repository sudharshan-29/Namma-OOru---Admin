import os
from PIL import Image
import numpy as np

im = Image.open(r'c:\Namma Ooru\civicproof-admin-dashboard (4)\public\crop-logo-highres.png').crop((15, 5, 55, 48))
arr = np.array(im)

print(f"Shape: {arr.shape}") # (43, 40, 3)

# Print out specific regions:
# 1. Lantern and Dome (rows 2 to 14, cols 10 to 30)
print("\n--- LANTERN & DOME (rows 2-14) ---")
for y in range(2, 15):
    line = f"{y:02d}: "
    for x in range(12, 28):
        r, g, b = arr[y, x][:3]
        if r > 180 and g > 180 and b > 180:
            line += "W "
        elif b > 190 and g > 160 and r < 120:
            line += "C "
        elif b > 140 and g > 110 and (b - r) > 25:
            line += "c "
        elif r < 50 and g < 70 and b < 90:
            line += "# "
        else:
            line += ". "
    print(line)

# 2. Tower Body (rows 15 to 30, cols 10 to 30)
print("\n--- TOWER BODY (rows 15-30) ---")
for y in range(15, 30):
    line = f"{y:02d}: "
    for x in range(12, 28):
        r, g, b = arr[y, x][:3]
        if r > 180 and g > 180 and b > 180:
            line += "W "
        elif b > 190 and g > 160 and r < 120:
            line += "C "
        elif b > 140 and g > 110 and (b - r) > 25:
            line += "c "
        elif r < 50 and g < 70 and b < 90:
            line += "# "
        else:
            line += ". "
    print(line)

# 3. Base Waves (rows 28 to 42, cols 0 to 40)
print("\n--- BASE WAVES (rows 28-42) ---")
for y in range(28, 43):
    line = f"{y:02d}: "
    for x in range(0, 40):
        r, g, b = arr[y, x][:3]
        if r > 180 and g > 180 and b > 180:
            line += "W"
        elif b > 180 and g > 150 and r < 120:
            line += "C"
        elif b > 130 and g > 100 and (b - r) > 20:
            line += "c"
        elif r < 50 and g < 70 and b < 90:
            line += "#"
        else:
            line += "."
    print(line)
