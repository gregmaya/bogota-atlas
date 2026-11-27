# Report, for each tile at zoom 11 and 12, its size and coordinate grid (MVT
# extent). GDAL writes a tile over its size limit on a coarser grid (extent below
# 4096), which makes lines snap and segments drop (docs/contract-notes.md).
# Standard library only.
#
#   python3 scripts/check-tile-grid.py <pmtiles-cli> <file.pmtiles> [west south east north]
#
# Bounds default to the bogota-syntax network extent.
import sys, gzip, math, subprocess
def varint(b,i):
    r=s=0
    while True:
        c=b[i]; i+=1; r|=(c&0x7f)<<s; s+=7
        if c<0x80: return r,i
def fields(b):
    i=0
    while i<len(b):
        k,i=varint(b,i); f,t=k>>3,k&7
        if t==0: v,i=varint(b,i)
        elif t==2: n,i=varint(b,i); v=b[i:i+n]; i+=n
        elif t==5: v=b[i:i+4]; i+=4
        elif t==1: v=b[i:i+8]; i+=8
        yield f,t,v
def tile_xy(lon,lat,z):
    n=2**z; x=int((lon+180)/360*n); y=int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n); return x,y
pm, f = sys.argv[1], sys.argv[2]
W, S, E, N = map(float, sys.argv[3:7]) if len(sys.argv) >= 7 else (-74.2175, 4.4693, -74.0127, 4.8281)
for z in (11,12):
    x0,y0=tile_xy(W,N,z); x1,y1=tile_xy(E,S,z)
    for x in range(x0,x1+1):
        for y in range(y0,y1+1):
            raw=subprocess.run([pm,'tile',f,str(z),str(x),str(y)],capture_output=True).stdout
            if not raw: continue
            data=gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw
            for fn,t,layer in fields(data):
                if fn==3:
                    ext=4096; nfeat=0
                    for lf,lt,lv in fields(layer):
                        if lf==5: ext=lv
                        if lf==2: nfeat+=1
                    print(f"z{z} {x}/{y}: {len(raw)/1024:.0f} KB gz, {len(data)/1024:.0f} KB raw, extent={ext} (grid {40075016/2**z/ext:.0f} m), features={nfeat}")
