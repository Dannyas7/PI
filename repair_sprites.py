"""Rebuild 12-pose fighter atlases from the concept art with isolated frames.

This deliberately uses *non-overlapping* source rectangles per pose, plus
component filtering and tile-clipped pasting. Prevents other fighters in a
source row from leaking into neighbouring frames.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import cv2
import numpy as np
ROOT = Path(__file__).resolve().parent
SOURCE = np.asarray(Image.open(ROOT/'assets/source/concept.png').convert('RGB'))
# Each rectangle is deliberately bounded between people in the original art.
# The bottom of the character is consistent within each art row.
BOXES = [
    (143, 211), # idle
    (217, 269), # walk 1
    (269, 318), # walk 2
    (320, 385), # run 1
    (385, 446), # run 2
    (496, 530), # jump: isolate second airborne pose
    (521, 592), # crouch
    (604, 666), # block
    (887, 944), # combo opener: full figure
    (779, 870), # kick
    (944, 999), # combo follow-through: full figure
    (1060, 1184), # special incl. effects
]
# Excludes the headings above each fighter. Cut at row bottom before border.
ROWS = {
    'daniel': (279, 369),
    'pancho': (426, 500),
    'alexis': (560, 662),
    'lucho': (698, 784),
}
W, H = 168, 132
for char, (top, bottom) in ROWS.items():
    atlas=Image.new('RGBA',(4*W,3*H), (0,0,0,0))
    for i,(x0,x1) in enumerate(BOXES):
        pix=SOURCE[top:bottom,x0:x1].copy()
        r,g,b=[pix[:,:,j].astype(np.int16) for j in range(3)]
        # Original concept panel background is a deep navy gradient.
        navy=(r<25) & (g<34) & ((b-r)>14) & ((b-g)>11)
        deep=(r<10)&(g<13)&(b<24)
        foreground=(~(navy|deep)).astype('uint8')
        # Remove tiny disconnected stars and remnants of other figures.
        labels_n, labels, stats, centroids=cv2.connectedComponentsWithStats(foreground,8)
        components=[]
        for label in range(1,labels_n):
            area=int(stats[label,cv2.CC_STAT_AREA]); x=int(stats[label,cv2.CC_STAT_LEFT]); y=int(stats[label,cv2.CC_STAT_TOP]); ww=int(stats[label,cv2.CC_STAT_WIDTH]);hh=int(stats[label,cv2.CC_STAT_HEIGHT]);
            if area>=9 and hh>=4:
                components.append((label, area, x,y,ww,hh))
        # Keep central figure components, not unrelated portions in distant corners.
        # The special's long effects are a deliberate exception.
        mask=np.zeros_like(foreground)
        for label,area,x,y,ww,hh in components:
            if i==11 or area>40 or (ww>=7 and hh>=7):mask[labels==label]=255
        # Remove pixels touching *source rectangle* side boundaries to avoid
        # edge cut-off artefacts/adjacent character limbs.
        for edge in [0,mask.shape[1]-1]:
            if edge == 0: mask[:,edge]=0
            else: mask[:,edge]=0
        rgba=np.dstack((pix, mask)).astype('uint8')
        frame=Image.fromarray(rgba,'RGBA')
        bounds=frame.getbbox()
        if not bounds:
            print('Empty frame',char,i); continue
        frame=frame.crop(bounds)
        # Maintain body size across poses; effects on special may fit smaller.
        scale=min(1.56, (H-14)/frame.height, (W-14)/frame.width)
        sz=(max(1,round(frame.width*scale)),max(1,round(frame.height*scale)))
        frame=frame.resize(sz,Image.Resampling.NEAREST)
        # Frame locally centered, baseline aligned for readable animations.
        # Keep each output cell perfectly isolated by pasting into a separate tile.
        tile=Image.new('RGBA',(W,H),(0,0,0,0))
        tx=(W-frame.width)//2
        ty=H-10-frame.height
        tile.alpha_composite(frame,(tx,ty))
        atlas.paste(tile,((i%4)*W,(i//4)*H))
    # Replace the composite's double-person jump with a single clear airborne pose,
    # using the one-person running pose. The engine supplies actual jump trajectory.
    run=atlas.crop((3*W, 0, 4*W, H))
    jump=Image.new('RGBA',(W,H),(0,0,0,0))
    pose=run.rotate(10,Image.Resampling.NEAREST,expand=False)
    jump.alpha_composite(pose,(0,-7))
    atlas.paste(jump,(W,H))  # frame 5 (row 2, col 2)
    # Remove isolated neighbour limbs from fighting frames 8 and 10.
    for ix in (4,5,8,10):
        fr=np.array(atlas.crop(((ix%4)*W,(ix//4)*H,(ix%4+1)*W,(ix//4+1)*H)))
        nc, labs, st, ctr=cv2.connectedComponentsWithStats((fr[:,:,3]>0).astype('uint8'),8)
        if nc>1:
            major=1+int(np.argmax(st[1:,cv2.CC_STAT_AREA]))
            # Main body is one connected component; screen effects belong only to special.
            fr[labs!=major]=[0,0,0,0]
            atlas.paste(Image.fromarray(fr,'RGBA'),((ix%4)*W,(ix//4)*H))
    atlas.save(ROOT/'assets/sprites'/f'{char}.png',optimize=True)
    print(f'{char}: sprites regenerated {atlas.width}x{atlas.height}')
