import os
import struct
import zlib
import io
from nbtlib import File, tag

WORLD = "silent_village"
ENTITY_DIR = os.path.join(WORLD, "entities")

FLAG = "HTB{7h053_wh0_kn0w}"#those who know
flag_bytes = [ord(c) for c in FLAG]

BYTES_PER_VILLAGER = 6
byte_index = 0
villager_index = 0
villagers_written = 0


def encode_bytes():
    global byte_index, villager_index

    gossip = tag.List[tag.Compound]()
    bytes_written = 0

    for _ in range(BYTES_PER_VILLAGER):
        if byte_index >= len(flag_bytes):
            break

        encoded = flag_bytes[byte_index] ^ villager_index

        gossip.append(tag.Compound({
            "Type": tag.String("major_positive"),
            "Value": tag.Int(encoded),
            "Target": tag.IntArray([1,2,3,4])
        }))

        byte_index += 1
        bytes_written += 1
    print(f"Villager No: {villager_index} hass been assigned {bytes_written} gossip values")
    villager_index += 1
    return gossip

def create_villager(x, y, z):
    return tag.Compound({
        "id": tag.String("minecraft:villager"),
        "Pos": tag.List[tag.Double]([x, y, z]),
        "Health": tag.Float(20),
        "VillagerData": tag.Compound({
            "profession": tag.String("minecraft:none"),
            "level": tag.Int(1),
            "type": tag.String("minecraft:plains")
        }),
        "Gossips": tag.List[tag.Compound]()
    })
def serialize_nbt(nbt):
    buf = io.BytesIO()
    nbt.write(buf)
    return buf.getvalue()

def process_chunk(nbt):
    global villagers_written, byte_index

    if "entities" not in nbt:
        nbt["entities"] = tag.List[tag.Compound]()
    entities = nbt["entities"]
    villagers_found = False

    for entity in entities:
        if entity.get("id") == "minecraft:villager":
            villagers_found = True
            if byte_index >= len(flag_bytes):
                break

            entity["Gossips"] = encode_bytes()
            villagers_written += 1
            print("[Modified existing villager")
    # if the villager isnt loaded make a new identical looking one
    if not villagers_found and byte_index < len(flag_bytes):
        villager = create_villager(0.0, 70.0, 0.0)
        villager["Gossips"] = encode_bytes()
        entities.append(villager)
        villagers_written += 1
        print("njected new villager")

    nbt["entities"] = entities

    return nbt
def process_region(path):

    with open(path, "rb") as f:
        data = bytearray(f.read())
    for i in range(1024):
        loc_offset = i * 4
        offset = struct.unpack(">I", b"\x00" + data[loc_offset:loc_offset+3])[0]
        #chunk data of a region is 32*32 chunks = 1024 chunks
        if offset == 0:
            continue

        start = offset * 4096
        length = struct.unpack(">I", data[start:start+4])[0]
        #each chunk sector offset is 4 bytes
        compression = data[start+4]

        chunk_data = data[start+5:start+5+length-1]

        if compression != 2:
            continue

        #extracting the values to read
        raw = zlib.decompress(chunk_data)
        nbt = File.parse(io.BytesIO(raw))
        nbt = process_chunk(nbt)

        new_raw = serialize_nbt(nbt)
        new_comp = zlib.compress(new_raw)

        new_len = len(new_comp) + 1

        data[start:start+4] = struct.pack(">I", new_len)
        data[start+4] = 2
        data[start+5:start+5+len(new_comp)] = new_comp

    with open(path, "wb") as f:
        f.write(data)


print("\ninjecting flag bytes! \n")

for file in os.listdir(ENTITY_DIR):

    if file.endswith(".mca"):

        region_path = os.path.join(ENTITY_DIR, file)

        print(f"[REGION] Processing {file}")

        process_region(region_path)


print("\nOutput: ")

print("Villagers written:", villagers_written)
print("Bytes written:", byte_index)
print("Expected bytes:", len(flag_bytes))

if byte_index == len(flag_bytes):
    print("all flag bytes injected.")
else:
    print("some flag bytes are not injected")