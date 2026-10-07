/**
 * Cloudflare Worker: API Live XSMB cho danhlo.xyz
 * Fetch kết quả mở thưởng xổ số miền Bắc trực tiếp theo thời gian thực (18h14 - 18h36)
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

      // Khung giờ quay thưởng XSMB: 18h14 đến 18h36
      const isDrawTime = totalMinutes >= 18 * 60 + 14 && totalMinutes <= 18 * 60 + 36;

      // 3. Fetch HTML kết quả mở thưởng
      const targetUrl = `https://xoso.com.vn/xsmb-${dateStrVN}.html`;
      const fetchResp = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cf: {
          // Cache 3 giây trong giờ quay thưởng để cập nhật tức thì, ngoài giờ cache 60 giây
          cacheTtl: isDrawTime ? 3 : 60,
          cacheEverything: true,
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

      // 4. Trích xuất các giải thưởng bằng regex
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

      // 5. Tự động tính 2 số cuối (lô tô) cho tất cả các giải đã về
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

      return jsonResponse(result, isDrawTime ? 3 : 60);
    } catch (err) {
      return jsonResponse({ error: err.message }, 0, 500);
    }
  },
};

function jsonResponse(data, cacheSeconds = 3, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Cache-Control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "no-store, no-cache",
    },
  });
}
