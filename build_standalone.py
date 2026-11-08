from pathlib import Path
import base64,re
root=Path(__file__).resolve().parent

def uri(path:Path):
    suffix=path.suffix.lower()
    mime={'png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','webp':'image/webp','svg':'image/svg+xml'}[suffix.lstrip('.')]
    return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode()

css=(root/'style.css').read_text(encoding='utf-8')
js=(root/'game.js').read_text(encoding='utf-8')
html=(root/'index.html').read_text(encoding='utf-8')
# All references to local images are inlined in both JS/CSS/HTML, no network dependencies.
for path in sorted((root/'assets').rglob('*')):
    if path.is_file() and path.suffix.lower() in ('.webp','.png','.jpg','.jpeg'):
        rel=path.relative_to(root).as_posix()
        val=uri(path)
        js=js.replace(rel,val)
        css=css.replace(rel,val)
        html=html.replace(rel,val)
room=uri(root/'cio_control_room.png')
js=js.replace('cio_control_room.png',room)
css=css.replace('cio_control_room.png',room)
html=html.replace('cio_control_room.png',room)
html=html.replace('<link rel="manifest" href="manifest.webmanifest">','')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
html=html.replace('<script src="combat-core.js"></script>','<script>'+(root/'combat-core.js').read_text(encoding='utf-8')+'</script>')
html=html.replace('<script src="audio-engine.js"></script>','<script>'+(root/'audio-engine.js').read_text(encoding='utf-8')+'</script>')
html=html.replace('<script src="net-config.js"></script>','<script>'+(root/'net-config.js').read_text(encoding='utf-8')+'</script>')
html=html.replace('<script src="online-client.js"></script>','<script>'+(root/'online-client.js').read_text(encoding='utf-8')+'</script>')
html=html.replace('<script src="game.js"></script>','<script>'+js+'</script>')
output=root/'Batalla_CIO_Arcade_V10_Jugar.html'
output.write_text(html,encoding='utf-8')
print('Standalone:',output,round(output.stat().st_size/1024/1024,2),'MiB')
