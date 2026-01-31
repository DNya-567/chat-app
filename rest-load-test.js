import http from "k6/http";
import { sleep, check } from "k6";

/*
  CHANGE THIS ONLY
*/
const BASE_URL = "https://chat-app-1-zpha.onrender.com/health";

/*
  WHAT THIS TEST DOES (IN ORDER):

  1. Warm-up (avoid cold start bias)
  2. Baseline load
  3. Spike test (sudden traffic)
  4. Stress test (find max capacity)
  5. Soak test (stability & leaks)

  You will get:
  - Failure %
  - p95 latency
  - Clear breaking point
*/

export let options = {
  thresholds: {
    http_req_failed: ["rate<0.05"],      // fail if >5% requests fail
    http_req_duration: ["p(95)<2000"],   // warn if p95 > 2s
  },

  stages: [
    // 1️⃣ WARM-UP
    { duration: "30s", target: 2 },

    // 2️⃣ BASELINE (should be perfect)
    { duration: "1m", target: 5 },

    // 3️⃣ SPIKE TEST (sudden surge)
    { duration: "10s", target: 25 },
    { duration: "30s", target: 25 },
    { duration: "10s", target: 5 },

    // 4️⃣ STRESS TEST (find breaking point)
    { duration: "30s", target: 10 },
    { duration: "30s", target: 20 },
    { duration: "30s", target: 30 },
    { duration: "30s", target: 40 },
    { duration: "30s", target: 50 },

    // 5️⃣ SOAK TEST (stability)
    { duration: "2m", target: 10 },

    // COOL DOWN
    { duration: "30s", target: 0 },
  ],
};

export default function () {
  const res = http.get(BASE_URL);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "latency < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
