import http from "k6/http";
import { sleep, check } from "k6";

export let options = {
  stages: [
    { duration: "30s", target: 5 },   // ramp to 5 users
    { duration: "1m", target: 5 },    // hold
    { duration: "30s", target: 0 },   // ramp down
  ],
};

export default function () {
  const res = http.get("https://chat-app-1-zpha.onrender.com/health");

  check(res, {
    "status is 200": (r) => r.status === 200,
    "latency < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
