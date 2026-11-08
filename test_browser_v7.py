from pathlib import Path
from playwright.sync_api import sync_playwright
import time
ROOT=Path(__file__).resolve().parent
HTML=Path('/mnt/data/Batalla_CIO_Arcade_V7_Jugar.html').read_text(encoding='utf-8')
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  for label,viewport,mobile in [('desktop',{'width':1366,'height':768},False),('horizontal',{'width':844,'height':390},True),('vertical',{'width':390,'height':844},True)]:
    c=browser.new_context(viewport=viewport,is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
    page=c.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(HTML,wait_until='domcontentloaded',timeout=45000)
    page.wait_for_timeout(400)
    assert page.locator('#menu').is_visible()
    page.screenshot(path=str(ROOT/f'preview_v7_{label}_menu.png'))
    page.locator('#nav-next').click();assert page.locator('#fighter-screen').is_visible()
    assert page.locator('#chars1 .char-card').count()==6
    page.locator('#chars1 .char-card').nth(4).click();assert page.locator('#focus-name').inner_text()=='MATI'
    page.screenshot(path=str(ROOT/f'preview_v7_{label}_roster.png'))
    page.locator('#roster-next').click();page.locator('#chars2 .char-card').nth(5).click()
    assert page.locator('#focus-name').inner_text()=='YERKO'
    page.locator('#roster-next').click();assert page.locator('#stage-screen').is_visible()
    page.locator('#stages .stage-card').nth(1).click()
    start=time.monotonic();page.locator('#start').click();assert page.locator('#vs-screen').is_visible()
    page.wait_for_timeout(1500);assert page.locator('#vs-screen').is_visible(), 'VS should stay >=3.8 sec'
    page.screenshot(path=str(ROOT/f'preview_v7_{label}_vs.png'))
    page.locator('#arena').wait_for(state='visible',timeout=15000)
    elapsed=time.monotonic()-start
    assert elapsed>=3.5, f'VS not long enough {elapsed}'
    assert page.locator('#name1').inner_text()=='MATI' and page.locator('#name2').inner_text()=='YERKO'
    page.wait_for_timeout(250)
    page.screenshot(path=str(ROOT/f'preview_v7_{label}_combat.png'))
    if mobile:
      assert page.locator('#touch-controls').is_visible()
      assert page.locator('#joystick-zone').is_visible()
      assert page.locator('#touch-controls .float-btn').count()==7
      zone=page.locator('#joystick-zone');r=zone.bounding_box();print('bounds joystick',label,r)
      assert r and r['width']>80 and r['height']>80
      page.evaluate('''() => { const z=document.getElementById('joystick-zone');const r=z.querySelector('.analog-face').getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;
       z.dispatchEvent(new PointerEvent('pointerdown',{pointerId:52,bubbles:true,clientX:x,clientY:y,pointerType:'touch'}));
       z.dispatchEvent(new PointerEvent('pointermove',{pointerId:52,bubbles:true,clientX:x+r.width*.32,clientY:y,pointerType:'touch'})); }''')
      transform=page.locator('#joystick-thumb').evaluate('(el)=>el.style.transform');assert 'translate(' in transform and '0px, 0px' not in transform,transform
      page.locator('[data-touch="quick"]').dispatch_event('pointerdown',{'pointerId':53,'pointerType':'touch'})
      assert page.locator('[data-touch="quick"]').evaluate('(el)=>el.classList.contains("is-down")')
      page.locator('[data-touch="quick"]').dispatch_event('pointerup',{'pointerId':53,'pointerType':'touch'})
      page.evaluate('''() => { const z=document.getElementById('joystick-zone');z.dispatchEvent(new PointerEvent('pointerup',{pointerId:52,bubbles:true,pointerType:'touch'})) }''')
    page.locator('#pause-button').click();assert page.locator('#pause-tag').is_visible()
    page.locator('#resume').click();assert page.locator('#pause-tag').is_hidden()
    assert not errors,errors
    print(f'PASS {label}: screen flow, VS {elapsed:.2f}s, fight, mobile={mobile}, errors={len(errors)}',flush=True)
    c.close()
  browser.close()
