import http.server
import socketserver
import os
import webbrowser
import sys
import json
import urllib.parse
from datetime import datetime, date, time
from zoneinfo import ZoneInfo

# Add scripts directory to sys.path
scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts')
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

import sync_lottery

# Configure UTF-8 for console output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(__file__), 'web')

class LotteryHttpHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/sync':
            self.handle_api_sync()
        elif path == '/api/live':
            self.handle_api_live()
        elif path in ('/api/status', '/api/latest'):
            self.handle_api_status()
        elif path.startswith('/data/'):
            self.handle_data_file(path)
        else:
            super().do_GET()

    def handle_data_file(self, path):
        rel = path.lstrip('/')
        target = os.path.join(DIRECTORY, rel)
        if not os.path.exists(target):
            target = os.path.join(os.path.dirname(__file__), rel)
        if os.path.exists(target) and os.path.isfile(target):
            ctype = 'text/csv; charset=utf-8' if target.endswith('.csv') else 'application/json; charset=utf-8'
            with open(target, 'rb') as f:
                body = f.read()
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404, f"File not found: {path}")

    def handle_api_sync(self):
        try:
            added = sync_lottery.sync_all()
            last_date = sync_lottery.get_last_csv_date()
            latest_rec = sync_lottery.get_latest_record()
            resp = {
                'success': True,
                'added': added,
                'latest_date': last_date.strftime('%Y-%m-%d') if last_date else None,
                'latest_record': latest_rec,
                'timestamp': datetime.now().isoformat()
            }
            self.send_json(resp)
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)}, status=500)

    def handle_api_live(self):
        try:
            tz = ZoneInfo('Asia/Ho_Chi_Minh')
            now = datetime.now(tz)
            today = now.date()

            # Check live draw for today
            live_data = sync_lottery.fetch_date_results(today)
            if not live_data:
                live_data = {
                    'date': today.strftime('%Y-%m-%d'),
                    'status': 'waiting',
                    'prizes_count': 0
                }

            is_draw_time = time(18, 14) <= now.time() <= time(18, 35)
            live_data['is_draw_time'] = is_draw_time
            live_data['current_time_vn'] = now.strftime('%H:%M:%S')

            # If completed and not yet in CSV, sync automatically
            last_date = sync_lottery.get_last_csv_date()
            if live_data.get('status') == 'completed' and last_date and last_date < today:
                sync_lottery.append_to_csv(live_data)
                sync_lottery.update_web_lottery_data()
                live_data['auto_saved'] = True

            # Also cache latest live data in data/latest.json
            try:
                latest_path = os.path.join(os.path.dirname(__file__), 'data', 'latest.json')
                with open(latest_path, 'w', encoding='utf-8') as lf:
                    json.dump(live_data, lf, ensure_ascii=False, indent=2)
            except Exception:
                pass

            self.send_json(live_data)
        except Exception as e:
            self.send_json({'error': str(e)}, status=500)

    def handle_api_status(self):
        tz = ZoneInfo('Asia/Ho_Chi_Minh')
        now = datetime.now(tz)
        last_date = sync_lottery.get_last_csv_date()
        latest_rec = sync_lottery.get_latest_record()
        self.send_json({
            'now_vn': now.strftime('%Y-%m-%d %H:%M:%S'),
            'today': now.date().strftime('%Y-%m-%d'),
            'db_latest_date': last_date.strftime('%Y-%m-%d') if last_date else None,
            'latest_record': latest_rec,
            'is_draw_time': time(18, 14) <= now.time() <= time(18, 35)
        })

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    port = PORT
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", port), LotteryHttpHandler) as httpd:
                url = f"http://localhost:{port}"
                print("=" * 60)
                print(f"[+] XSMB VIP Web & API Server dang chay tai: {url}")
                print(f"[+] Thu muc web: {DIRECTORY}")
                print("[+] API Endpoints: /api/sync, /api/live, /api/status")
                print("=" * 60)
                
                if '--no-browser' not in sys.argv:
                    webbrowser.open(url)
                
                httpd.serve_forever()
                break
        except OSError as e:
            if 'Address already in use' in str(e) or '10048' in str(e):
                port += 1
            else:
                raise

if __name__ == '__main__':
    main()
