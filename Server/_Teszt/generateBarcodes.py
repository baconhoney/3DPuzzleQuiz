import json, pathlib, math
from unidecode import unidecode
from PIL import Image
from datamatrix_modified.datamatrix import DataMatrix


# ------ CONSTANTS ------
#DMCCONTENT = "{uid}|{box}|{name}"  # format string for the DataMatrix content, use 'ascii' mode
#DMCCONTENT = "{uid}" # use 'ascii' mode
DMCCONTENT = "{box}" # use 'text' mode
DMCCODEC = "text"
NAMELENGTH = 50  # max length of the name in the DataMatrix code
PIXELSIZES = [0.05]  # sizes of one pixel in cm
CODESIZES = [0.5, 2, 3]  # sizes of one dmc in cm
CODESPERLINE = 8  # number of codes per line
SPACING = 3  # spacing between the code images (total)
BORDER = 0  # separation around the codes
FGCOLOR = (0, 0, 0)  # foreground color
BGCOLOR = (255, 255, 255)  # background color
SORTKEY = lambda x: x["box"] or 0  # sort key for the ordering of the entries


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
data: dict[str, str | list[dict[str, str | int]]] = json.load(open(cwd / "masterList.json", encoding="utf-8"))
entries: list[dict[str, str | int]] = sorted(data["entries"], key=SORTKEY)

valueList: set[str] = set()
for entry in entries:
    uid: int = entry["id"]
    name: str = unidecode(entry["name_hu"])
    if len(name) > NAMELENGTH:
        raise RuntimeError(f"Name '{name}' is too long ({len(name)} > {NAMELENGTH})")
    name = name.ljust(NAMELENGTH, ".")
    box = str(entry["box"] or "null")
    valueList.add(DMCCONTENT.format(uid=uid, name=name, box=box))

dmcCodes: list[DataMatrix] = []
for entry in valueList:
    dmc = DataMatrix(entry, codecs=[DMCCODEC])
    matrix = dmc.matrix
    print(f"'{entry}': codec={dmc.usedCodec}, {len(matrix)}x{len(matrix[0])}")
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

outputImage = outputImage.convert("L")
# Resize image cuz Word is stupid and cannot handle pixels
multiplier = int(15000 / totalWidth)
outputImage.resize((totalWidth * multiplier, totalHeight * multiplier), resample=Image.Resampling.NEAREST).save(cwd / "dmcs.png")
print(f"\nImage width: {totalWidth}px, DMC width: {dmcRawSize}px\nImage sizes:")
for ps in PIXELSIZES:
    print(f"- 1 px is {ps:.4f}cm: {totalWidth * ps:.4f}cm")
for cs in CODESIZES:
    print(f"- DMC is {cs}cm: {totalWidth * cs / dmcRawSize:.4f}cm")
outputImage.show()
