// Лаб 3, Алхам 6: slo-test.js-ийн threshold-ийг ЗОРИУД эвдсэн FAIL хувилбар.
// Зорилго: k6 FAIL үед ямар мөр гаргаж, ямар exit code (99) буцаахыг харах.
//
// Endpoint бүрийг `name` tag-аар ялгаж, threshold-ийг tag тус бүрд тавьсан.
// Ажиллуулах (сервер асаалттай байх ёстой):
//   k6 run slo-test-fail.js 2>&1 | tee results/fail.txt; echo "exit=$pipestatus[1]"  (zsh)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: __ENV.DURATION || '1m',
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    // Харьцуулах: /cart/add p95 < 50ms — localhost дээр ~1-2ms тул PASS хэвээр үлдэнэ
    'http_req_duration{name:cart}': ['p(95)<50'],
    // Reliability SLO: /pay error rate < 8% (серверт 5% алдаа суулгасан)
    'http_req_failed{name:pay}': ['rate<0.08'],
    // Availability SLO: бүх хүсэлтийн амжилтын хувь > 90%
    'checks': ['rate>0.90'],
    // ЗОРИУД ЭВДСЭН: /report p95 < 100ms — сервер 200ms-ээс хурдан хэзээ ч хариулдаггүй тул найдвартай FAIL
    'http_req_duration{name:report}': ['p(95)<100'],
  },
};

export default function () {
  const base = 'http://localhost:3000';
  // Нэг итерац = нэг хэрэглэгч сагсанд нэмж, тайлан харж, төлбөр төлнө
  const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
  const r = http.get(`${base}/report`, { tags: { name: 'report' } });
  const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });
  // checks = Availability SLI (амжилттай хүсэлтийн хувь)
  check(c, { 'cart 200': (x) => x.status === 200 });
  check(r, { 'report 200': (x) => x.status === 200 });
  check(p, { 'pay 200': (x) => x.status === 200 });
  sleep(1); // хэрэглэгчийн "бодох" хугацаа
}
