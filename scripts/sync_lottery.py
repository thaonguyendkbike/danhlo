import csv
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, date, timedelta, time
from zoneinfo import ZoneInfo

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'xsmb.csv')
JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'xsmb.json')
WEB_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'web', 'js', 'lottery-data.js')

def fetch_date_results(target_date: date):
    """Fetch results from xoso.com.vn for a specific date"""
    dt_str = target_date.strftime('%d-%m-%Y')
    url = f"https://xoso.com.vn/xsmb-{dt_str}.html"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8')
    except Exception as e:
        print(f"Error connecting to {url}: {e}")
        return None

    def extract(pattern):
        matches = re.findall(pattern, html)
        return [m.strip() for m in matches if m.strip() and m.strip() != '...']

    special = extract(r'class=[\'"]?special-prize[\'"]?[^>]*>([^<]+)<')
    p1 = extract(r'class=[\'"]?prize1[\'"]?[^>]*>([^<]+)<')
    p2 = extract(r'class=[\'"]?prize2[\'"]?[^>]*>([^<]+)<')
    p3 = extract(r'class=[\'"]?prize3[\'"]?[^>]*>([^<]+)<')
    p4 = extract(r'class=[\'"]?prize4[\'"]?[^>]*>([^<]+)<')
    p5 = extract(r'class=[\'"]?prize5[\'"]?[^>]*>([^<]+)<')
    p6 = extract(r'class=[\'"]?prize6[\'"]?[^>]*>([^<]+)<')
    p7 = extract(r'class=[\'"]?prize7[\'"]?[^>]*>([^<]+)<')

    total_prizes = len(special) + len(p1) + len(p2) + len(p3) + len(p4) + len(p5) + len(p6) + len(p7)
    
    status = 'completed' if total_prizes == 27 else ('drawing' if total_prizes > 0 else 'waiting')

    res_obj = {
        'date': target_date.strftime('%Y-%m-%d'),
        'status': status,
        'prizes_count': total_prizes,
        'special': special[0] if special else None,
        'p1': p1[0] if p1 else None,
        'p2': p2,
        'p3': p3,
        'p4': p4,
        'p5': p5,
        'p6': p6,
        'p7': p7
    }

    # Always calculate loto for whatever numbers have been revealed so far
    all_nums = []
    if res_obj['special']:
        all_nums.append(res_obj['special'])
    if res_obj['p1']:
        all_nums.append(res_obj['p1'])
    for sub in [res_obj['p2'], res_obj['p3'], res_obj['p4'], res_obj['p5'], res_obj['p6'], res_obj['p7']]:
        for n in sub:
            if n:
                all_nums.append(n)
    res_obj['loto'] = [n[-2:] for n in all_nums]

    return res_obj

def get_last_csv_date():
    if not os.path.exists(CSV_PATH):
        return None
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        last_row = None
        for row in reader:
            if row:
                last_row = row
        if last_row:
            return datetime.strptime(last_row[0], '%Y-%m-%d').date()
    return None

def get_latest_record():
    if not os.path.exists(CSV_PATH):
        return None
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        last_row = None
        for row in reader:
            if row:
                last_row = row
        if last_row and len(last_row) >= 28:
            pad = lambda v, l: str(v).strip().zfill(l)
            sp = pad(last_row[1], 5)
            p1 = pad(last_row[2], 5)
            p2 = [pad(last_row[3], 5), pad(last_row[4], 5)]
            p3 = [pad(last_row[5], 5), pad(last_row[6], 5), pad(last_row[7], 5), pad(last_row[8], 5), pad(last_row[9], 5), pad(last_row[10], 5)]
            p4 = [pad(last_row[11], 4), pad(last_row[12], 4), pad(last_row[13], 4), pad(last_row[14], 4)]
            p5 = [pad(last_row[15], 4), pad(last_row[16], 4), pad(last_row[17], 4), pad(last_row[18], 4), pad(last_row[19], 4), pad(last_row[20], 4)]
            p6 = [pad(last_row[21], 3), pad(last_row[22], 3), pad(last_row[23], 3)]
            p7 = [pad(last_row[24], 2), pad(last_row[25], 2), pad(last_row[26], 2), pad(last_row[27], 2)]
            all_nums = [sp, p1] + p2 + p3 + p4 + p5 + p6 + p7
            return {
                'date': last_row[0],
                'special': sp,
                'p1': p1, 'p2': p2, 'p3': p3, 'p4': p4, 'p5': p5, 'p6': p6, 'p7': p7,
                'loto': [n[-2:] for n in all_nums]
            }
    return None

def append_to_csv(rec):
    row = [
        rec['date'],
        str(int(rec['special'])),
        str(int(rec['p1'])),
        str(int(rec['p2'][0])), str(int(rec['p2'][1])),
        str(int(rec['p3'][0])), str(int(rec['p3'][1])), str(int(rec['p3'][2])),
        str(int(rec['p3'][3])), str(int(rec['p3'][4])), str(int(rec['p3'][5])),
        str(int(rec['p4'][0])), str(int(rec['p4'][1])), str(int(rec['p4'][2])), str(int(rec['p4'][3])),
        str(int(rec['p5'][0])), str(int(rec['p5'][1])), str(int(rec['p5'][2])),
        str(int(rec['p5'][3])), str(int(rec['p5'][4])), str(int(rec['p5'][5])),
        str(int(rec['p6'][0])), str(int(rec['p6'][1])), str(int(rec['p6'][2])),
        str(int(rec['p7'][0])), str(int(rec['p7'][1])), str(int(rec['p7'][2])), str(int(rec['p7'][3])),
    ]
    with open(CSV_PATH, 'a', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(row)

def update_web_lottery_data():
    """Regenerate web/js/lottery-data.js from data/xsmb.csv"""
    from prepare_web_data import main as prep_main
    prep_main()

def sync_all():
    """Sync missing dates up to today"""
    last_d = get_last_csv_date()
    if not last_d:
        print("Cannot determine last CSV date!")
        return []

    tz = ZoneInfo('Asia/Ho_Chi_Minh')
    now = datetime.now(tz)
    today = now.date()

    # Target end date: if after 18:15, try to sync today if complete
    end_date = today
    if now.time() < time(18, 15):
        end_date = today - timedelta(days=1)

    print(f"Current DB last date: {last_d}, Target date: {end_date}")

    added = []
    curr = last_d + timedelta(days=1)
    while curr <= end_date:
        print(f"Fetching missing date: {curr}...")
        rec = fetch_date_results(curr)
        if rec and rec['status'] == 'completed':
            append_to_csv(rec)
            added.append(rec['date'])
            print(f"  -> Added {rec['date']} successfully! Special: {rec['special']}")
        else:
            print(f"  -> {curr} not available yet (Status: {rec.get('status') if rec else 'Error'})")
            break
        curr += timedelta(days=1)

    if added:
        print(f"Updating web data with {len(added)} new dates: {added}...")
        update_web_lottery_data()

    return added

if __name__ == '__main__':
    added = sync_all()
    print(f"Finished sync. Added: {added}")
