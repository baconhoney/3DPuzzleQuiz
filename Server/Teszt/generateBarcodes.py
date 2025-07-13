import barcode, io
from PIL import Image

img = io.BytesIO()
barcode.generate('code128', '7648|Name', output=img, writer=barcode.writer.ImageWriter(), text="7648")
img.seek(0)
Image.open(img).show()
