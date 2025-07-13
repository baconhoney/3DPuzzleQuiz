import barcode, io, json, pathlib, ppf.datamatrix
from PIL import Image
from cairosvg import svg2png

# ------ CONSTANTS ------
NAMELENGTH = 50
CODESPERLINE = 5
SPACING = 1 # spacing/border *around* the code images (total)

# ------ MAIN CODE ------
cwd = pathlib.Path(__file__).parent.resolve()
data = json.load(open(cwd / "masterList.json", encoding="utf-8"))
idx: int
for idx, entry in data["entries"].items():
    name: str = entry["hu"]["name"]
    if len(name) > NAMELENGTH:
        raise RuntimeError(f"Name '{name}' is too long ({len(name)} > {NAMELENGTH})")
    #name = name.ljust(NAMELENGTH, "_")
    img = io.BytesIO()
    #barcode.generate("code128", f"{idx}|{name}", output=img, writer=barcode.writer.ImageWriter(), text=str(idx))
    dmc: ppf.datamatrix.DataMatrix = ppf.datamatrix.DataMatrix(f"{idx}|{name}")
    svg2png(bytestring=dmc.svg(), write_to=img, output_width=1000, output_height=1000)
    Image.open(img).show()
    break

