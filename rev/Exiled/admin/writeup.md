# Minecraft Gossip Writeup

---

## Overview

In this challenge, players are given a Minecraft save world folder named `silent_village`. The goal is to analyze the Minecraft entity region files (`.mca`) and uncover a hidden flag encoded within the properties of the entities.

---

## Step 1: Reconnaissance

Upon investigating the provided `silent_village` folder, the most notable sub-directory is `entities/`, which contains Minecraft Region files (`.mca` extension). These files follow the Anvil format and store NBT (Named Binary Tag) data for all entities loaded in different chunks of the world.

A standard approach to reverse-engineering or analyzing Minecraft map data is to use NBT parsers like `NBTExplorer` or writing a Python script using libraries such as `nbtlib` to read the raw entity attributes.

---

## Step 2: The Datapack Clue

Before blindly digging through the NBT data, a careful look into the `silent_village/datapacks/` directory reveals a custom datapack named `crafting_tweaks`. Inside its scripts, specifically at `data/crafting_tweaks/bolt/gossip_inject.bolt`, we uncover a major hint:

```plaintext
module crafting_tweaks:gossip_worker

worker gossip_scan {
    villagers = world.entities("villager")
    index = 0
    for v in villagers {
        g = v.gossip()
        for entry in g {
            value = entry.Value
            decoded = value ^ index
            memory.push(decoded)
        }
        index += 1
    }
}
```

This snippet tells us exactly where the hidden information lies and how to extract it:
1. Iterate over all `villager` entities in the world.
2. Read their `gossip` entries.
3. Examine the `Value` property of each gossip.
4. XOR the `Value` with an incrementing `index` (which increments per villager) to get the `decoded` byte.

Equipped with this logic, we know our target: extract Villager NBT data.

---

## Step 3: Finding the Anomaly in Region Files

When players dump or explore the NBT trees inside the `.mca` files, they can locate the `minecraft:villager` entities mentioned in the datapack. Villagers in Minecraft contain a `Gossips` tag, which usually tracks a player's reputation  as per the 1.14 update 

Looking at the `Gossips` array inside these NBT structures:

```json
"Gossips": [
    {
        "Type": "major_positive",
        "Value": 72,
        "Target": [1, 2, 3, 4]
    },
    ...
]
```

The integer `Value` entries fall into the printable ASCII range. As hinted by the script, the sequence of these values encodes the flag.

---

## Step 4: The Encoding Mechanism

Following the `.bolt` script's logic, if the player extracts the raw decimal `Value` sequentially across all the villagers, they get an array of numbers. 

Comparing the first few numbers to the known flag format `HTB{`:
- Villager 0, Gossip 0: `72` -> `'H'` (`72 ^ 0 = 72`)
- Villager 0, Gossip 1: `84` -> `'T'` (`84 ^ 0 = 84`)
- ... For the next villager, the index increments!

The challenge employs a dynamic XOR cipher. Every time a new villager entity is processed, a `villager_index` counter increments. The `Value` of the gossip is encoded as:
`encoded_value = flag_byte ^ villager_index`

To decode, the formula is symmetric (as shown in the `.bolt` clue):
`flag_byte = gossip_value ^ villager_index`

---

## Step 5: The Solve Script

To extract the flag, players must write a parser that:
1. Iterates over all `.mca` files in the `entities` directory.
2. Extracts chunk data, decompressing the NBT blobs using zlib
3. Finds `minecraft:villager` entities.
4. Traverses their `Gossips` array and extracts the decoded bytes using an incrementing index for each villager.

Here is a simplified Python solve script doing exactly that using the `nbtlib` library:

```python
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

    # .mca files contain up to 1024 chunks
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

        # Look for villagers and extract gossip values
        for e in nbt["entities"]:
            if e.get("id") == "minecraft:villager" and "Gossips" in e:
                for g in e["Gossips"]:
                    flag.append(g["Value"] ^ villager_index)
                
                villager_index += 1

print("".join(chr(x) for x in flag))
```

Running the extraction script will successfully decode the integers back into ASCII and print the final flag.

`HTB{7h053_wh0_kn0w}`
