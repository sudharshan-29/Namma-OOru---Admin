import os
import re
from PIL import Image, ImageDraw
import numpy as np

# Load reference crop
ref_path = r'c:\Namma Ooru\civicproof-admin-dashboard (4)\public\crop-logo-highres.png'
ref_im = Image.open(ref_path)
print(f"Loaded ref image: {ref_im.size}")
