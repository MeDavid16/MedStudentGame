import pathlib
s=pathlib.Path('src')
html=(s/'shell.html').read_text()
qbf=['qb/_init.js']+sorted('qb/'+p.name for p in (s/'qb').glob('*.js') if p.name!='_init.js')
js='\n'.join((s/f).read_text() for f in ['data.js']+qbf+['questions.js','saves.js','game.js','weapons.js','decor.js','person.js','music.js','maniac.js','title.js','ui.js'])
html=html.replace('/*CSS*/',(s/'style.css').read_text()).replace('<script>/*JS*/</script>','<script>\n'+js+'\n</script>')
pathlib.Path('index.html').write_text(html)
print(len(html))
