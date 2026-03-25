# Operation Brainrot Heist 

On running strings challenge.wav
We find:
uggcf://jjj.lbhghor.pbz/jngpu?i=Y81a7BhmwvR

Decoding the above string gives:
https://www.youtube.com/watch?v=L81n7OuzjiE

from the video you derive the key: sixseven

On running binwalk challenge.wav

The output shows:
PNG image at offset 882122

So there is an embedded PNG inside the WAV file.

Run:
dd if=challenge.wav of=extracted.png bs=1 skip=882122

Opening the image reveals:
ZBY{hv0a_r33q5_l0_keaPG}

Decrypt using vignere with key: sixseven

we get the flag yay:

HTB{pr0f_n33d5_t0_chiLL}
