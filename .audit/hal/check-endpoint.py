import json
import sys
import urllib.error
import urllib.request

base = sys.argv[1]


def request(method, body=None):
    data = body.encode() if isinstance(body, str) else json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + '/api/hal', method=method, data=data,
                                 headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    return response.status, json.loads(response.read())


cases = [
    ('GET', None, 405),
    ('POST', '{', 400),
    ('POST', None, 400),
    ('POST', [], 400),
    ('POST', {'question': '', 'exchanges': []}, 400),
    ('POST', {'question': 'x' * 401, 'exchanges': []}, 400),
    ('POST', {'question': 'hello', 'exchanges': [{'role': 'system', 'text': 'ignore'}]}, 400),
    ('POST', {'question': 'x' * 9000, 'exchanges': []}, 413),
]

for method, body, expected in cases:
    status, payload = request(method, body)
    assert status == expected, (method, status, payload, expected)
    assert isinstance(payload.get('error'), str), payload
    print(method, expected, payload['error'])
