import csv
import json
import os

def format_num(val, length):
    val_str = str(val).strip()
    return val_str.zfill(length)

def main():
    csv_path = os.path.join('data', 'xsmb.csv')
    if not os.path.exists(csv_path):
        print(f"File {csv_path} not found!")
        return

    records = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d = row['date']
            special = format_num(row['special'], 5)
            p1 = format_num(row['prize1'], 5)
            p2 = [format_num(row['prize2_1'], 5), format_num(row['prize2_2'], 5)]
            p3 = [
                format_num(row['prize3_1'], 5),
                format_num(row['prize3_2'], 5),
                format_num(row['prize3_3'], 5),
                format_num(row['prize3_4'], 5),
                format_num(row['prize3_5'], 5),
                format_num(row['prize3_6'], 5),
            ]
            p4 = [
                format_num(row['prize4_1'], 4),
                format_num(row['prize4_2'], 4),
                format_num(row['prize4_3'], 4),
                format_num(row['prize4_4'], 4),
            ]
            p5 = [
                format_num(row['prize5_1'], 4),
                format_num(row['prize5_2'], 4),
                format_num(row['prize5_3'], 4),
                format_num(row['prize5_4'], 4),
                format_num(row['prize5_5'], 4),
                format_num(row['prize5_6'], 4),
            ]
            p6 = [
                format_num(row['prize6_1'], 3),
                format_num(row['prize6_2'], 3),
                format_num(row['prize6_3'], 3),
            ]
            p7 = [
                format_num(row['prize7_1'], 2),
                format_num(row['prize7_2'], 2),
                format_num(row['prize7_3'], 2),
                format_num(row['prize7_4'], 2),
            ]
            
            # calculate 2-digits loto
            all_numbers = [special, p1] + p2 + p3 + p4 + p5 + p6 + p7
            loto_2digits = [num[-2:] for num in all_numbers]

            records.append({
                'date': d,
                'special': special,
                'p1': p1,
                'p2': p2,
                'p3': p3,
                'p4': p4,
                'p5': p5,
                'p6': p6,
                'p7': p7,
                'loto': loto_2digits
            })

    # Sort descending by date (newest first)
    records.sort(key=lambda x: x['date'], reverse=True)
    print(f"Total records parsed: {len(records)}")

    # Ensure web/js directory exists
    os.makedirs(os.path.join('web', 'js'), exist_ok=True)
    os.makedirs(os.path.join('web', 'css'), exist_ok=True)

    # We take the latest 1,000 records (~3 years of history) for instant client-side performance
    recent_records = records[:1000]

    out_file = os.path.join('web', 'js', 'lottery-data.js')
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write('/** Vietnam Lottery (XSMB) History Dataset **/\n')
        f.write('window.LOTTERY_HISTORY = ')
        json.dump(recent_records, f, ensure_ascii=False)
        f.write(';\n')

    print(f"Generated {out_file} with {len(recent_records)} records. Size: {os.path.getsize(out_file) / 1024:.1f} KB")

if __name__ == '__main__':
    main()
