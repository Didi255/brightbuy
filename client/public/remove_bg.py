import rembg
from PIL import Image
import os

input_path = r'e:\brightbuy\client\public\Logo.png'
output_path = r'e:\brightbuy\client\public\logo-transparent.png'

# Read the image
input_image = Image.open(input_path)

# Apply rembg
output_image = rembg.remove(input_image)

# Save the result
output_image.save(output_path)
print(f"Background successfully removed and saved to {output_path}")
