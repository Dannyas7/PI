from playwright.sync_api import sync_playwright
from pathlib import Path
import http.server,threading,functools,time
root=Path(__file__).resolve().parent
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=(root/'index.html').as_uri()
print('URL',url,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for typ,viewport,device,touch in [('desktop',{'width':1440,'height':900},False,False),('mobile_landscape',{'width':844,'height':390},True,True),('mobile_portrait',{'width':390,'height':844},True,True)]:
  context=browser.new_context(viewport=viewport,device_scale_factor=1,is_mobile=device,has_touch=touch)
  page=context.new_page(); errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(Path('/mnt/data/Batalla_CIO_Arcade_V6_Jugar.html').read_text(encoding='utf-8'),wait_until='domcontentloaded',timeout=45000)
  page.screenshot(path=str(root/f'preview_{typ}_home.png'))
  assert page.locator('#menu').is_visible()
  page.locator('#nav-next').click()
  assert page.locator('#fighter-screen').is_visible()
  assert page.locator('#chars1 .char-card').count()==6
  page.locator('#chars1 .char-card').nth(4).click()
  page.screenshot(path=str(root/f'preview_{typ}_roster.png'))
  assert page.locator('#focus-name').inner_text()=='MATI'
  page.locator('#roster-next').click()
  assert page.locator('#roster-player-label').inner_text()=='RIVAL CPU'
  page.locator('#chars2 .char-card').nth(5).click()
  assert page.locator('#focus-name').inner_text()=='YERKO'
  page.locator('#roster-next').click()
  assert page.locator('#stage-screen').is_visible()
  page.locator('#stages .stage-card').nth(1).click()
  page.screenshot(path=str(root/f'preview_{typ}_stages.png'))
  assert page.locator('#stage-title').inner_text()=='PLANTA CONCENTRADORA'
  page.locator('#start').click()
  assert page.locator('#vs-screen').is_visible()
  page.screenshot(path=str(root/f'preview_{typ}_vs.png'))
  page.wait_for_timeout(1850)
  assert page.locator('#arena').is_visible(), 'Arena did not start'
  assert page.locator('#name1').inner_text()=='MATI'
  assert page.locator('#name2').inner_text()=='YERKO'
  page.wait_for_timeout(200)
  page.screenshot(path=str(root/f'preview_{typ}_fight.png'))
  page.locator('#pause-button').click()
  assert page.locator('#pause-tag').is_visible()
  page.locator('#resume').click()
  assert not page.locator('#pause-tag').is_visible()
  if typ=='desktop':
   page.keyboard.down('d');page.keyboard.down('Shift');page.wait_for_timeout(120);page.keyboard.up('Shift');page.keyboard.up('d')
   page.keyboard.press('j');page.wait_for_timeout(120)
  elif typ=='mobile_landscape':
   page.locator('[data-touch="left"]').dispatch_event('pointerdown',{'pointerId':4})
   page.locator('[data-touch="left"]').dispatch_event('pointerup',{'pointerId':4})
   assert page.locator('#touch-controls').is_visible()
  print(typ,'errors:',errors,'canvas:',page.locator('#game').evaluate('(el)=>({w:el.clientWidth,h:el.clientHeight})'),flush=True)
  assert not errors,errors
  context.close()
 browser.close()
server.shutdown()
