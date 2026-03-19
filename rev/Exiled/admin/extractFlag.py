import os
import struct
import zlib
import io
from nbtlib import File

WORLD = "silent_village/entities"

flag = []
villager_index = 0

for region in os.listdir(WORLD):

    if not region.endswith(".mca"):
        continue

    with open(os.path.join(WORLD, region), "rb") as f:
        data = f.read()

    for i in range(1024):

        offset = struct.unpack(">I", b"\x00" + data[i*4:i*4+3])[0]
        if offset == 0:
            continue

        start = offset * 4096
        length = struct.unpack(">I", data[start:start+4])[0]
        compression = data[start+4]

        if compression != 2:
            continue

        raw = zlib.decompress(data[start+5:start+5+length-1])
        nbt = File.parse(io.BytesIO(raw))

        if "entities" not in nbt:
            continue

        for e in nbt["entities"]:
            if e.get("id") == "minecraft:villager" and "Gossips" in e:

                for g in e["Gossips"]:
                    flag.append(g["Value"] ^ villager_index)

                villager_index += 1

print("".join(chr(x) for x in flag))
