import pathlib
s=pathlib.Path('src')
html=(s/'shell.html').read_text()
js='\n'.join((s/f).read_text() for f in ['data.js','questions.js','game.js','weapons.js','person.js','music.js','title.js','ui.js'])
html=html.replace('/*CSS*/',(s/'style.css').read_text()).replace('<script>/*JS*/</script>','<script>\n'+js+'\n</script>')
pathlib.Path('index.html').write_text(html)
print(len(html))
