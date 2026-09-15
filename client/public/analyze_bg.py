from PIL import Image

img = Image.open(r'e:\brightbuy\client\public\Logo.png').convert('RGBA')
pixels = img.load()

colors = set()
for y in range(20):
    for x in range(20):
        colors.add(pixels[x, y])

print("Background checkerboard colors found in the top-left 20x20 pixels:")
for c in colors:
    print(c)
