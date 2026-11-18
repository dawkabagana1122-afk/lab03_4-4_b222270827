// Лаб 3, Алхам 4: README-ийн SLO хүснэгтийг k6 threshold болгосон тест.
// Босго бүр README-ийн "Алхам 3: SLO" хүснэгттэй ИЖИЛ байх ёстой.
//
// Endpoint бүрийг `name` tag-аар ялгаж, threshold-ийг tag тус бүрд тавьсан.
// Ажиллуулах (сервер асаалттай байх ёстой):
//   k6 run slo-test.js 2>&1 | tee results/pass.txt
//   DURATION=2m k6 run slo-test.js 2>&1 | tee results/chaos.txt   ← Алхам 5 (chaos)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: __ENV.DURATION || '1m',
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    // Performance SLO: /cart/add — p95 < 10ms, p99 < 25ms (baseline p95=1.68ms)
    'http_req_duration{name:cart}': ['p(95)<10', 'p(99)<25'],
    // Reliability SLO: /pay error rate < 8% (серверт 5% алдаа суулгасан)
    'http_req_failed{name:pay}': ['rate<0.08'],
    // Availability SLO: бүх хүсэлтийн амжилтын хувь > 90%
    'checks': ['rate>0.90'],
    // Нэмэлт 4 дэх сценарио: /report p95 < 450ms (дизайнаар max 400ms)
    'http_req_duration{name:report}': ['p(95)<450'],
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
