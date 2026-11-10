import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', 
    data=json.dumps({'email': 'officer@udrrms.com', 'password': 'password123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    token = data.get('access_token')

headers = {'Authorization': f'Bearer {token}'}

for ep in [
    '/api/v1/inventory/stock', 
    '/api/v1/inventory/transactions', 
    '/api/v1/inventory/warehouses', 
    '/api/v1/resources',
    '/api/v1/analytics/dashboard',
    '/api/v1/analytics/overview'
]:
    try:
        r = urllib.request.Request(f'http://127.0.0.1:8000{ep}', headers=headers)
        with urllib.request.urlopen(r) as resp:
            d = json.loads(resp.read().decode('utf-8'))
            print(f'{ep} -> Success: {d.get("success")}, Count: {d.get("count")}')
            for k in d:
                if isinstance(d[k], list) and d[k]:
                    print(f'   List key "{k}" (len={len(d[k])}), first item keys: {list(d[k][0].keys())[:10]}')
                    if k in ['stock', 'inventory']:
                        print(f'      first item sample: {d[k][0]}')
                elif isinstance(d[k], dict):
                    print(f'   Dict key "{k}": {list(d[k].keys())[:10]}')
    except Exception as e:
        print(f'{ep} -> Error: {e}')
