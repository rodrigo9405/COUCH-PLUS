"""Genera index.html (versión web) a partir de src/. Uso: python3 build.py"""
import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
FILES = ['fig3d.js', 'core.js', 'store-supabase.js', 'ui.js', 'shared.js', 'admin.js', 'views.js', 'trainer.js', 'student.js', 'main.js']
LIBS = ['https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js',
        'https://cdn.jsdelivr.net/npm/htm@3.1.1/preact/standalone.umd.js',
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js']
ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%23C8312B'/%3E%3Ccircle cx='32' cy='32' r='22' fill='%231F58B5'/%3E%3Ccircle cx='32' cy='32' r='14' fill='%23D9A21B'/%3E%3Ccircle cx='32' cy='32' r='6' fill='%23AEB6C0'/%3E%3C/svg%3E"
js = '\n'.join((src / f).read_text() for f in FILES)
css = (src / 'styles.css').read_text()
libs = '\n'.join(f'<script src="{u}"></script>' for u in LIBS)
(root / 'index.html').write_text(f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>COUCH+</title>
<meta name="description" content="COUCH+: rutinas guiadas en 3D, dietas, revisiones y pagos para entrenadores y sus alumnos.">
<meta name="theme-color" content="#10151C">
<link rel="icon" href="{ICON}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap">
</head>
<body>
<style>
{css}
</style>
<div id="app"></div>
{libs}
<script>
{js}
</script>
</body>
</html>
''')
print('index.html generado')
