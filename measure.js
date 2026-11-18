// Босго сонгохоос ӨМНӨ бодит тоог хэмжих скрипт (SLO биш!).
// k6 нь tag тус бүрийн статистикийг зөвхөн тухайн tag-д threshold байгаа үед
// summary-д гаргадаг. Тиймээс энд хэзээ ч зөрчигдөхгүй (p(95)>=0, rate>=0)
// "харуулах" threshold тавьж, endpoint бүрийн p90/p95/p99, error rate-ийг харна.
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20, duration: '1m',
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  thresholds: {
    'http_req_duration{name:cart}': ['p(95)>=0'],
    'http_req_duration{name:report}': ['p(95)>=0'],
    'http_req_duration{name:pay}': ['p(95)>=0'],
    'http_req_failed{name:pay}': ['rate>=0'],
    'http_reqs{name:cart}': ['count>=0'],
  },
};

export default function () {
  const base = 'http://localhost:3000';
  const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
  const r = http.get(`${base}/report`, { tags: { name: 'report' } });
  const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });
  check(c, { 'cart 200': (x) => x.status === 200 });
  check(r, { 'report 200': (x) => x.status === 200 });
  check(p, { 'pay 200': (x) => x.status === 200 });
  sleep(1);
}
