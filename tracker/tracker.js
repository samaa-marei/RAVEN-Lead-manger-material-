/* Rise Course Tracking Layer
   Version: 1.0
   This file is independent from the Rise-generated course files.
*/
(function () {
  "use strict";

  const cfg = window.RISE_TRACKER_CONFIG || {};
  const ENDPOINT = cfg.endpoint || "";
  const COURSE_ID = cfg.courseId || "rise-course";
  const HEARTBEAT_MS = Number(cfg.heartbeatMs || 60000);

  const sessionKey = "rise_tracker_session_" + COURSE_ID;
  const stored = localStorage.getItem(sessionKey);
  const session = stored ? JSON.parse(stored) : {
    sessionId: (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)),
    name: "",
    startedAt: null,
    activeSeconds: 0
  };

  let lastTick = null;
  let heartbeatTimer = null;
  let started = false;

  function save() {
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }

  function send(eventName, extra) {
    if (!ENDPOINT || !session.name) return;

    const payload = Object.assign({
      event: eventName,
      courseId: COURSE_ID,
      sessionId: session.sessionId,
      name: session.name,
      timestamp: new Date().toISOString(),
      activeSeconds: Math.round(session.activeSeconds)
    }, extra || {});

    const body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        navigator.sendBeacon(ENDPOINT, blob);
      } else {
        fetch(ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body
        }).catch(function () {});
      }
    } catch (_) {}
  }

  function tick() {
    if (!started || document.hidden) {
      lastTick = null;
      return;
    }
    const now = Date.now();
    if (lastTick !== null) {
      const delta = Math.min(now - lastTick, HEARTBEAT_MS * 2);
      session.activeSeconds += delta / 1000;
      save();
    }
    lastTick = now;
  }

  function heartbeat() {
    tick();
    if (started && !document.hidden) send("heartbeat");
  }

  function buildScreen() {
    const style = document.createElement("style");
    style.textContent = `
      #rise-tracker-screen {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,.98);
        font-family: system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      #rise-tracker-card {
        width: min(92vw, 440px); padding: 32px; border-radius: 18px;
        background: #fff; box-shadow: 0 12px 45px rgba(0,0,0,.16);
        box-sizing: border-box;
      }
      #rise-tracker-card h1 { margin: 0 0 10px; font-size: 26px; }
      #rise-tracker-card p { margin: 0 0 22px; color: #555; line-height: 1.5; }
      #rise-tracker-name {
        width: 100%; box-sizing: border-box; padding: 12px 14px;
        border: 1px solid #bbb; border-radius: 10px; font-size: 16px;
      }
      #rise-tracker-start {
        width: 100%; margin-top: 12px; padding: 12px 16px;
        border: 0; border-radius: 10px; font-size: 16px; cursor: pointer;
        background: #111; color: #fff;
      }
      #rise-tracker-error { color: #b00020; min-height: 22px; margin-top: 8px; }
    `;

    const screen = document.createElement("div");
    screen.id = "rise-tracker-screen";
    screen.innerHTML = `
      <div id="rise-tracker-card">
        <h1>Welcome</h1>
        <p>Please enter your name before starting the training.</p>
        <input id="rise-tracker-name" autocomplete="name" placeholder="Your name">
        <div id="rise-tracker-error"></div>
        <button id="rise-tracker-start">Start training</button>
      </div>
    `;
    document.head.appendChild(style);
    document.body.appendChild(screen);

    const input = document.getElementById("rise-tracker-name");
    const button = document.getElementById("rise-tracker-start");
    const error = document.getElementById("rise-tracker-error");

    button.addEventListener("click", function () {
      const name = input.value.trim();
      if (!name) {
        error.textContent = "Please enter your name.";
        input.focus();
        return;
      }

      session.name = name;
      session.startedAt = new Date().toISOString();
      session.activeSeconds = 0;
      save();

      started = true;
      lastTick = Date.now();
      screen.remove();

      send("start", { startedAt: session.startedAt });
      heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") button.click();
    });

    window.addEventListener("beforeunload", function () {
      tick();
      send("leave");
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        tick();
        if (started) send("inactive");
      } else {
        lastTick = Date.now();
        if (started) send("active");
      }
    });
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", buildScreen);
    } else {
      buildScreen();
    }
  }

  init();
})();
