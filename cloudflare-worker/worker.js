/**
 * Cloudflare Worker: API Live XSMB cho danhlo.xyz
 * Fetch kết quả mở thưởng xổ số miền Bắc trực tiếp theo thời gian thực (18h10 - 18h40)
 * Nguồn chính: WebSocket/Realtime Engine (Xổ Số Đại Phát Live Stream)
 * Nguồn dự phòng: Xổ Số VN (xoso.com.vn)
 * Hỗ trợ CORS đầy đủ cho web frontend danhlo.xyz
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Xử lý preflight CORS OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      // 2. Tính ngày giờ hiện tại theo giờ Việt Nam (UTC+7)
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const vnDate = new Date(utcTime + 7 * 3600000);

      const yyyy = vnDate.getFullYear();
      const mm = String(vnDate.getMonth() + 1).padStart(2, "0");
      const dd = String(vnDate.getDate()).padStart(2, "0");

      const dateStrIso = `${yyyy}-${mm}-${dd}`;
      const dateStrVN = `${dd}-${mm}-${yyyy}`;

      const hours = vnDate.getHours();
      const mins = vnDate.getMinutes();
      const totalMinutes = hours * 60 + mins;

      // Khung giờ quay thưởng XSMB: 18h10 đến 18h40
      const isDrawTime = totalMinutes >= 18 * 60 + 10 && totalMinutes <= 18 * 60 + 40;

      // --- NGUỒN 1 (Ưu tiên số 1): Realtime Live Stream JSON ---
      try {
        const dUtc = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const time15s = `${dUtc.getUTCFullYear()}${pad(dUtc.getUTCMonth() + 1)}${pad(dUtc.getUTCDate())}${pad(dUtc.getUTCHours())}${pad(dUtc.getUTCMinutes())}${Math.floor(dUtc.getUTCSeconds() / 15)}`;
        const liveApiUrl = `https://live.xosodaiphat.com/lotteryLive/1/${time15s}`;

        const liveResp = await fetch(liveApiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://xosodaiphat.com/xsmb-xo-so-mien-bac.html",
          },
          cf: {
            cacheTtl: isDrawTime ? 0 : 30,
            cacheEverything: false,
          },
        });

        if (liveResp.ok) {
          const liveJson = await liveResp.json();
          const parsed = parseLotteryLive(liveJson, dateStrIso);

          if (parsed) {
            // Nếu nguồn live đã cập nhật đúng ngày hôm nay
            if (parsed.date === dateStrIso) {
              parsed.is_draw_time = isDrawTime;
              parsed.current_time_vn = `${pad(hours)}:${pad(mins)}:${pad(vnDate.getSeconds())}`;
              parsed.source = "realtime_stream";
              return jsonResponse(parsed, isDrawTime ? 0 : 60);
            } else if (parsed.date < dateStrIso && !isDrawTime && totalMinutes < 18 * 60 + 10) {
              // Chưa đến giờ quay hôm nay
              return jsonResponse({
                date: dateStrIso,
                status: "waiting",
                prizes_count: 0,
                is_draw_time: false,
                current_time_vn: `${pad(hours)}:${pad(mins)}:${pad(vnDate.getSeconds())}`,
                source: "realtime_stream",
                special: null, p1: null, p2: [], p3: [], p4: [], p5: [], p6: [], p7: [], loto: []
              }, 60);
            }
          }
        }
      } catch (errStream) {
        console.warn("Realtime stream fetch error, falling back to html scraping:", errStream);
      }

      // --- NGUỒN 2: Fallback cào HTML từ xoso.com.vn ---
      const targetUrl = `https://xoso.com.vn/xsmb-${dateStrVN}.html`;
      const fetchResp = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cf: {
          cacheTtl: isDrawTime ? 0 : 60,
          cacheEverything: false,
        },
      });

      if (!fetchResp.ok) {
        return jsonResponse({
          date: dateStrIso,
          status: "waiting",
          prizes_count: 0,
          is_draw_time: isDrawTime,
          error: `Nguồn dữ liệu trả về mã ${fetchResp.status}`,
        });
      }

      const html = await fetchResp.text();

      function extract(pattern) {
        const matches = [];
        const regex = new RegExp(pattern, "gi");
        let m;
        while ((m = regex.exec(html)) !== null) {
          const val = m[1].trim();
          if (val && val !== "..." && !val.includes("<")) {
            matches.push(val);
          }
        }
        return matches;
      }

      const special = extract(/class=['"]?special-prize['"]?[^>]*>([^<]+)</);
      const p1 = extract(/class=['"]?prize1['"]?[^>]*>([^<]+)</);
      const p2 = extract(/class=['"]?prize2['"]?[^>]*>([^<]+)</);
      const p3 = extract(/class=['"]?prize3['"]?[^>]*>([^<]+)</);
      const p4 = extract(/class=['"]?prize4['"]?[^>]*>([^<]+)</);
      const p5 = extract(/class=['"]?prize5['"]?[^>]*>([^<]+)</);
      const p6 = extract(/class=['"]?prize6['"]?[^>]*>([^<]+)</);
      const p7 = extract(/class=['"]?prize7['"]?[^>]*>([^<]+)</);

      const totalPrizes = special.length + p1.length + p2.length + p3.length + p4.length + p5.length + p6.length + p7.length;
      const status = totalPrizes === 27 ? "completed" : (totalPrizes > 0 ? "drawing" : "waiting");

      const allNums = [];
      if (special[0]) allNums.push(special[0]);
      if (p1[0]) allNums.push(p1[0]);
      [p2, p3, p4, p5, p6, p7].forEach((arr) => {
        arr.forEach((n) => { if (n) allNums.push(n); });
      });
      const loto = allNums.map((n) => n.slice(-2));

      const result = {
        date: dateStrIso,
        status: status,
        prizes_count: totalPrizes,
        is_draw_time: isDrawTime,
        current_time_vn: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(vnDate.getSeconds()).padStart(2, "0")}`,
        source: "html_scraping",
        special: special[0] || null,
        p1: p1[0] || null,
        p2: p2,
        p3: p3,
        p4: p4,
        p5: p5,
        p6: p6,
        p7: p7,
        loto: loto,
      };

      return jsonResponse(result, isDrawTime ? 0 : 60);
    } catch (err) {
      return jsonResponse({ error: err.message }, 0, 500);
    }
  },
};

function parseLotteryLive(data, targetDateIso) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const item = data[0];
  if (!item || !item.LotPrizes) return null;

  let dateIso = targetDateIso;
  if (item.CrDateTime) {
    const m = item.CrDateTime.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      dateIso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }
  }

  const parseRange = (rangeStr) => {
    if (!rangeStr) return [];
    return rangeStr.split('-').map(s => s.trim()).filter(Boolean);
  };

  let special = null;
  let p1 = null;
  let p2 = [], p3 = [], p4 = [], p5 = [], p6 = [], p7 = [];

  item.LotPrizes.forEach(lp => {
    const p = (lp.Prize || '').toUpperCase();
    const parts = parseRange(lp.Range);
    if (p === 'DB' || p === 'G.DB' || p === 'ĐB') {
      const val = parts[0];
      if (val && val !== '...' && !val.includes('.')) special = val;
    } else if (p === 'G.1' || p === '1') {
      const val = parts[0];
      if (val && val !== '...' && !val.includes('.')) p1 = val;
    } else if (p === 'G.2' || p === '2') {
      p2 = parts.filter(v => v !== '...' && !v.includes('.'));
    } else if (p === 'G.3' || p === '3') {
      p3 = parts.filter(v => v !== '...' && !v.includes('.'));
    } else if (p === 'G.4' || p === '4') {
      p4 = parts.filter(v => v !== '...' && !v.includes('.'));
    } else if (p === 'G.5' || p === '5') {
      p5 = parts.filter(v => v !== '...' && !v.includes('.'));
    } else if (p === 'G.6' || p === '6') {
      p6 = parts.filter(v => v !== '...' && !v.includes('.'));
    } else if (p === 'G.7' || p === '7') {
      p7 = parts.filter(v => v !== '...' && !v.includes('.'));
    }
  });

  const allNums = [];
  if (special) allNums.push(special);
  if (p1) allNums.push(p1);
  [p2, p3, p4, p5, p6, p7].forEach(arr => {
    arr.forEach(n => { if (n) allNums.push(n); });
  });

  const totalPrizes = allNums.length;
  const loto = allNums.map(n => n.slice(-2));
  const status = totalPrizes === 27 ? 'completed' : (totalPrizes > 0 ? 'drawing' : 'waiting');

  return {
    date: dateIso,
    status,
    prizes_count: totalPrizes,
    special,
    p1,
    p2,
    p3,
    p4,
    p5,
    p6,
    p7,
    loto
  };
}

function jsonResponse(data, cacheSeconds = 0, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
    },
  });
}
