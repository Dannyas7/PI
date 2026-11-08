"""Visual regression safeguards for the four-fighter 4x3 sprite atlases."""
from pathlib import Path
from PIL import Image
import numpy as np
import cv2
root=Path(__file__).resolve().parent
for name in ('daniel','pancho','alexis','lucho'):
    image=Image.open(root/'assets/sprites'/f'{name}.png').convert('RGBA')
    assert image.size==(672,396),f'{name}: wrong atlas size'
    data=np.asarray(image)
    for i in range(12):
        frame=data[(i//4)*132:((i//4)+1)*132,(i%4)*168:((i%4)+1)*168,:]
        a=frame[:,:,3]
        assert int(np.count_nonzero(a))>500,f'{name}/{i}: empty figure'
        assert a[0,0]==0 and a[-1,-1]==0,f'{name}/{i}: unmasked tile background'
        if i in (4,5,8,10):
            labels_n,_,stats,_=cv2.connectedComponentsWithStats((a>0).astype('uint8'),8)
            big=sum(int(s[4])>60 for s in stats[1:])
            assert big==1,f'{name}/{i}: {big} disconnected large foreground fragments'
print('PASS: 48 isolated sprite cells, transparency and artifact isolation')
src=(root/'game.js').read_text()
assert "const flashCanvas = document.createElement('canvas')" in src
assert "ctx.clearRect(0, 0, canvas.width, canvas.height)" in src
assert "ctx.drawImage(flashCanvas" in src
assert "Math.round((Math.random() - .5) * shake)" in src
print('PASS: offscreen hit flash, full clear and integer shake')
