import os
import sys
import json
import base64
import urllib.request
import urllib.error

TOKEN = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('GITHUB_TOKEN')
if not TOKEN:
    print("Error: Se requiere un token de GitHub. Uso: python upload_to_github.py <TU_TOKEN>")
    sys.exit(1)

OWNER = 'darwindiaz328-ai'
REPO = 'TasaVenezuela'
BRANCH = 'main'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Antigravity-Agent',
    'X-GitHub-Api-Version': '2022-11-28'
}

def gh_request(endpoint, method='GET', data=None):
    url = f'https://api.github.com/repos/{OWNER}/{REPO}/{endpoint}'
    body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f'Error HTTP {e.code} en {endpoint}: {err_msg}')
        raise

print('1. Obteniendo referencia de la rama main...')
ref = gh_request(f'git/ref/heads/{BRANCH}')
latest_commit_sha = ref['object']['sha']
print(f'Latest commit SHA: {latest_commit_sha}')

commit_obj = gh_request(f'git/commits/{latest_commit_sha}')
base_tree_sha = commit_obj['tree']['sha']
print(f'Base tree SHA: {base_tree_sha}')

files_to_push = [
    'HISTORIAL_PROYECTO.md',
    'GEMINI.md',
    '.agents/rules/registro_historial.md',
    '.github/workflows/auto_update.yml',
    'update_rates.py',
    'validate_history.py',
    'trigger_webhook.py',
    'setup_cloud_cron.py',
    'upload_to_github.py',
    '.gitignore',
    'index.html',
    'styles.css',
    'sw.js',
    'app.js',
    'historial.json',
    'Datos/rates.json'
]

tree_items = []
print('2. Creando blobs en GitHub...')
base_dir = os.path.dirname(os.path.abspath(__file__))

for rel_path in files_to_push:
    full_path = os.path.join(base_dir, rel_path.replace('/', os.sep))
    if not os.path.exists(full_path):
        print(f'Advertencia: Archivo no encontrado {full_path}')
        continue
    
    if rel_path == 'historial.json':
        try:
            # Sincronizar automáticamente con el historial remoto para nunca perder fechas previas
            remote_hist_raw = gh_request('contents/historial.json')
            if 'content' in remote_hist_raw:
                remote_hist_data = json.loads(base64.b64decode(remote_hist_raw['content']).decode('utf-8'))
                with open(full_path, 'r', encoding='utf-8') as hf:
                    local_hist_data = json.load(hf)
                merged = {**remote_hist_data, **local_hist_data}
                sorted_merged = dict(sorted(merged.items(), key=lambda x: x[0], reverse=True))
                with open(full_path, 'w', encoding='utf-8') as hf:
                    json.dump(sorted_merged, hf, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f'Aviso al sincronizar historial.json remoto: {e}')

    with open(full_path, 'rb') as f:
        content_b64 = base64.b64encode(f.read()).decode('utf-8')
        
    blob_res = gh_request('git/blobs', method='POST', data={
        'content': content_b64,
        'encoding': 'base64'
    })
    blob_sha = blob_res['sha']
    print(f'Blob creado para {rel_path}: {blob_sha}')
    tree_items.append({
        'path': rel_path,
        'mode': '100644',
        'type': 'blob',
        'sha': blob_sha
    })

print('3. Creando nuevo árbol de archivos...')
new_tree = gh_request('git/trees', method='POST', data={
    'base_tree': base_tree_sha,
    'tree': tree_items
})
new_tree_sha = new_tree['sha']
print(f'Nuevo Tree SHA: {new_tree_sha}')

print('4. Creando commit...')
commit_message = sys.argv[2] if len(sys.argv) > 2 else 'feat: activar disparo por webhook externo y soporte medianoche'
new_commit = gh_request('git/commits', method='POST', data={
    'message': commit_message,
    'tree': new_tree_sha,
    'parents': [latest_commit_sha]
})
new_commit_sha = new_commit['sha']
print(f'Nuevo Commit SHA: {new_commit_sha}')

print('5. Actualizando rama main...')
updated_ref = gh_request(f'git/refs/heads/{BRANCH}', method='PATCH', data={
    'sha': new_commit_sha,
    'force': False
})
print('¡ÉXITO! Rama main actualizada con el nuevo commit.')
