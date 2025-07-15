import io, json, pathlib, math
from unidecode import unidecode
from PIL import Image
from ppf.datamatrix.datamatrix import DataMatrix

# from pprint import pprint
# from cairosvg import svg2png

# ------ CONSTANTS ------
#DMCCONTENT = "{idx}|{box}|{name}"  # format string for the DataMatrix content
DMCCONTENT = "{idx}"
NAMELENGTH = 50  # max length of the name in the DataMatrix code
PIXELSIZES = [0.05]  # sizes of one pixel in cm
CODESIZES = [0.5, 2]  # sizes of one dmc in cm
CODESPERLINE = 10  # number of codes per line
SPACING = 3  # spacing between the code images (total)
BORDER = 0  # separation around the codes
FGCOLOR = (0, 0, 0)  # foreground color
BGCOLOR = (255, 255, 255)  # background color
SORTKEY = lambda x: x[0]  # sort key for the ordering of the entries


# ------ FUNCTIONS ------
def dmcToPng(dmc: DataMatrix, /, bg: tuple = (255, 255, 255), fg: tuple = (0, 0, 0), border: int = 1) -> Image.Image:
    """Converts a DataMatrix object to a PNG image with the specified background and foreground colors."""
    matrix = dmc.matrix
    width = len(matrix[0])
    height = len(matrix)
    img = Image.new("RGB", (width + border * 2, height + border * 2), bg)
    for y, row in enumerate(matrix):
        for x, cell in enumerate(row):
            if cell:
                img.putpixel((x + border, y + border), fg)
    return img


# ------ MAIN CODE ------
cwd = pathlib.Path(__file__).parent.resolve()
data: dict[str, str | dict[str, str | int]] = json.load(open(cwd / "masterList.json", encoding="utf-8"))
data["entries"] = dict(sorted(list(data["entries"].items()), key=SORTKEY))

i: int
dmcCodes: list[DataMatrix] = []
for uid, entry in data["entries"].items():
    name: str = unidecode(entry["hu"]["name"])
    if len(name) > NAMELENGTH:
        raise RuntimeError(f"Name '{name}' is too long ({len(name)} > {NAMELENGTH})")
    name = name.ljust(NAMELENGTH, ".")
    box = str(entry["box"] or "0000")
    dmc = DataMatrix(DMCCONTENT.format(idx=uid, name=name, box=box), codecs=["ascii"])
    print(f"{uid}: '{dmc.message}'")
    # dmcToPng(dmc).show()
    dmcCodes.append(dmc)
    # break

# --- Generate output image ---
dmcCount = len(dmcCodes)
dmcRawSize = len(dmcCodes[0].matrix)

# Check if all codes are the same size
assert all(len(dmc.matrix) == dmcRawSize for dmc in dmcCodes), "Not all DataMatrix codes have the same height"
assert all(len(dmc.matrix[0]) == dmcRawSize for dmc in dmcCodes), "Not all DataMatrix codes have the same width"

CODESPERLINE = min(CODESPERLINE, dmcCount)
codesPerColumn = math.ceil(dmcCount / CODESPERLINE)
dmcSize = dmcRawSize + BORDER * 2
totalWidth = dmcSize * CODESPERLINE + (CODESPERLINE + 1) * SPACING
totalHeight = codesPerColumn * dmcSize + (codesPerColumn + 1) * SPACING

outputImage = Image.new("RGB", (totalWidth, totalHeight), (255, 255, 255))
for i, dmc in enumerate(dmcCodes):
    x = (i % CODESPERLINE) * (dmcSize + SPACING) + SPACING
    y = (i // CODESPERLINE) * (dmcSize + SPACING) + SPACING
    outputImage.paste(dmcToPng(dmc, bg=BGCOLOR, fg=FGCOLOR, border=BORDER), (x, y))

outputImage.show()
outputImage.save(cwd / "dmcs.png")
print(f"\nImage width: {totalWidth}px, DMC width: {dmcRawSize}px\nImage sizes:")
for ps in PIXELSIZES:
    print(f"- 1 px is {ps:.4f}cm: {totalWidth * ps:.4f}cm")
for cs in CODESIZES:
    print(f"- DMC is {cs}cm: {totalWidth * cs / dmcRawSize:.4f}cm")

