import sys
import os
import base64
import subprocess

def encode_zw(text):
    # Mapping bits to zero-width characters
    # 0 -> ZWSP (U+200B)
    # 1 -> ZWNJ (U+200C)
    zero = '\u200b'
    one = '\u200c'
    
    result = ""
    for char in text:
        binary = format(ord(char), '08b')
        zw_bin = binary.replace('0', zero).replace('1', one)
        result += zw_bin
    return result

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 generate_challenge.py /path/to/origami_bird.jpg")
        sys.exit(1)
    
    source_img = sys.argv[1]
    # Keep everything relative to the script's location
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_img = os.path.join(output_dir, "origami.jpg")
    coords_txt = os.path.join(output_dir, "coordinates.txt")
    
    flag = "HTB{m4st3r_0f_th3_un1v3rs3_4nd_st3g0}"
    hidden_payload = encode_zw(flag)
    
    with open(coords_txt, "w", encoding="utf-8") as f:
        f.write("Target: Royal Mint of Spain\n")
        f.write("Rendezvous: 40.4230° N, 3.6681° W\n")
        f.write("Time: 08:00 AM\n")
        f.write("Note: The Professor's instructions follow." + hidden_payload + "\n")
        f.write("Burn after reading.\n")
        
    os.system(f"cp '{source_img}' '{output_img}'")
    
    password = "Dali_M4sk_2026"
    steghide_cmd = f"steghide embed -ef '{coords_txt}' -cf '{output_img}' -p '{password}' -f"
    
    # Run steghide directly without the dangling try: block
    subprocess.run(steghide_cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    b64_hint = base64.b64encode(password.encode()).decode()
    exif_cmd = f"exiftool -overwrite_original -Comment='base64: {b64_hint}' '{output_img}'"
    
    # Run exiftool directly without the dangling try: block
    subprocess.run(exif_cmd, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    print(f" generated image path: {output_img}")
    os.remove(coords_txt)

main()
