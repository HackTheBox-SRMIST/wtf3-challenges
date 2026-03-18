# progRAM --- Writeup

## Challenge Overview

We are given memory dump `memory.raw`.The goal is to recover a hidden flag that was supposedly deleted.\


------------------------------------------------------------------------


## Step 1: Identify the given memory dump

We start by checking command history:

``` bash
vol2 -f memory.raw imageinfo
```

### Key finding:

    Suggested Profile(s) : Win7SP1x64, Win7SP0x64, Win2008R2SP0x64, Win2008R2SP1x64_23418, Win2008R2SP1x64, Win7SP1x64_23418

Since the image info suggests that this is a memory dump of a Windows 7 SP1 system we will use Volatility2 with `Win7SP1x64` profile 

## Step 2: Identify suspicious activity (cmdscan)

We start by checking command history:

``` bash
vol2 -f memory.raw --profile=Win7SP1x64 cmdscan
```

### Key finding:

    7z x secret.zip -pfaaaaah

 This reveals: - Archive name: `secret.zip` - Password: `faaaaah`

------------------------------------------------------------------------

## tep 3: Identify interesting processes

Next, inspect process tree:

``` bash
vol2 -f memory.raw --profile=Win7SP1x64 pstree
```

### Key observation:

    python.exe (child of cmd.exe)

Suspicious because: - User executed some python script from the command prompt manually - Likely used to load something into memory

------------------------------------------------------------------------

## Step 4: Dump process memory

Dump the Python process:

``` bash
vol2 -f memory.raw --profile=Win7SP1x64 memdump -p 1216 -D dumps/
```


------------------------------------------------------------------------

## 🔎 Step 4: Carve embedded files

Use binwalk to scan the dumped memory:

``` bash
binwalk -e dumps/1216.dmp
```

### Key result:

    1755192       0x1AC838        Zip archive data, encrypted compressed size: 512065, uncompressed size: 512037, name: flag.txt

 Binwalk extracts:

    _1216.dmp.extracted/1AC838.zip

------------------------------------------------------------------------

##  Step 5: Extract archive

``` bash
7z x 1AC838.zip
```

Enter password:

    faaaaah



------------------------------------------------------------------------

## Step 6: Retrieve the flag

``` bash
cat flag.txt
```

### Output:

    HTB{ny4y4_n4_r4jy4m_l4vn3_n4_bh0jy4m}

------------------------------------------------------------------------
