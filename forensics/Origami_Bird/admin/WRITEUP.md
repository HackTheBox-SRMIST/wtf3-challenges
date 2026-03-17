# The Origami Bird (Medium Forensics/Stego)

**Flag:** `HTB{m4st3r_0f_th3_un1v3rs3_4nd_st3g0}`

## Description
The Professor left a paper origami bird at the scene. You've scanned it into a high-res JPEG. It looks ordinary, but the Professor never leaves anything by accident.

## Intended Solution Path
1. **EXIF Metadata:** use `exiftool origami.jpg` to reveal a base64 comment tag: `base64: RGFsaV9NNHNrXzIwMjY=`.
2. **Decode Base64:** decoding the string yields the password: `Dali_M4sk_2024`.
3. **Steghide Extraction:** tun `steghide extract -sf origami.jpg -p "Dali_M4sk_2026"` to extract a hidden file named `coordinates.txt`.
4. **Zero-Width Steganography:** the extracted `coordinates.txt` looks like a normal text file, but it contains invisible Zero-Width Characters (ZWSP `U+200B` and ZWNJ `U+200C`) representing binary data.
5. **Decode Flag:** use a zero-width decoding tool to convert the invisible characters back to text, revealing the flag.

## Files
- `admin/generate_challenge.py`: Script used to build the challenge artifact.
- `handout/handout.zip`: The zip file provided to the participants containing `origami.jpg`.
