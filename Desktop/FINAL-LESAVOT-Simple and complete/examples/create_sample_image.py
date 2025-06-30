from PIL import Image, ImageDraw
import numpy as np

# Create a simple image
width, height = 300, 200
img = Image.new('RGB', (width, height), color=(255, 255, 255))

# Draw something on it
draw = ImageDraw.Draw(img)
draw.rectangle([(50, 50), (250, 150)], fill=(0, 128, 255))
draw.ellipse([(100, 75), (200, 125)], fill=(255, 255, 0))

# Save the image
img.save('examples/data/original.png')
print("Sample image created at examples/data/original.png")
