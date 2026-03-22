# The Origami Bird (Medium Forensics/Stego)

**Flag:** `HTB{m4st3r_0f_th3_un1v3rs3_4nd_st3g0}`

## Description
The Professor left a paper origami bird at the scene. You've scanned it into a high-res JPEG. It looks ordinary, but the Professor never leaves anything by accident.

## Intended Solution Path
1. **EXIF Metadata:** Use `exiftool origami.jpg` to reveal a base64 comment tag: `base64: RGFsaV9NNHNrXzIwMjY=`.
2. **Decode Base64:** Decoding the string yields the password: `Dali_M4sk_2026`.
3. **Steghide Extraction:** Run `steghide extract -sf origami.jpg -p "Dali_M4sk_2026"` to extract a hidden file named `coordinates.txt`.
4. **Zero-Width Steganography (The Trick):** 
   - At first glance, `coordinates.txt` looks like a normal text file. 
   - However, if you check the file size or open it in a hex editor (`xxd coordinates.txt`), you will notice a large block of hidden bytes appended to the end of the text. 
   - Specifically, you will see repeating patterns of `e2 80 8b` (Zero-Width Space) and `e2 80 8c` (Zero-Width Non-Joiner). These invisible characters encode binary data where ZWSP = `0` and ZWNJ = `1`.
5. **Decode Flag:** 
   - **Method:** Copy the text from `coordinates.txt` and paste it into an online Zero-Width Steganography decoder to get the flag.
