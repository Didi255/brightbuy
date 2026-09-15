from PIL import Image

input_path = r'e:\brightbuy\client\public\Logo.png'
output_path = r'e:\brightbuy\client\public\Logo.png' # Overwrite the file

img = Image.open(input_path).convert("RGBA")
pixels = img.load()
width, height = img.size

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # The checkerboard is dark grey (RGB around 70-85)
        # The logo is bright orange and white.
        # If the pixel is dark (R, G, and B all < 120), make it transparent.
        if r < 120 and g < 120 and b < 120:
            pixels[x, y] = (0, 0, 0, 0)
        elif r < 140 and g < 140 and b < 140:
            # Catch antialiasing edges slightly above 120
            # Calculate an alpha ramp for smooth edges (optional, but a hard cutoff is fine if we just want it gone)
            pixels[x, y] = (r, g, b, 0)

img.save(output_path)
print("Checkerboard removed successfully!")
