(function () {
  "use strict";

  const cfg = window.RISE_TRACKER_CONFIG || {};
  const ENDPOINT = cfg.endpoint || "";
  const COURSE_ID = cfg.courseId || "rise-course";
  const HEARTBEAT_MS = Number(cfg.heartbeatMs || 60000);

  let sessionId =
    (crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(36).slice(2));

  let name = "";
  let startedAt = null;
  let activeSeconds = 0;
  let lastTick = null;
  let heartbeatTimer = null;
  let started = false;

  function send(eventName) {
    if (!ENDPOINT || !name) return;

    const payload = {
      event: eventName,
      courseId: COURSE_ID,
      sessionId: sessionId,
      name: name,
      timestamp: new Date().toISOString(),
      startedAt: startedAt,
      activeSeconds: Math.round(activeSeconds)
    };

    fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function (error) {
      console.log("Tracker error:", error);
    });
  }

  function tick() {
    if (!started || document.hidden) {
      lastTick = null;
      return;
    }

    const now = Date.now();

    if (lastTick !== null) {
      const delta = Math.min(now - lastTick, HEARTBEAT_MS * 2);
      activeSeconds += delta / 1000;
    }

    lastTick = now;
  }

  function heartbeat() {
    tick();

    if (started && !document.hidden) {
      send("heartbeat");
    }
  }

  function createScreen() {
    const screen = document.createElement("div");

    screen.style.cssText = `
      position:fixed;
      inset:0;
      z-index:2147483647;
      display:flex;
      align-items:center;
      justify-content:center;
      background:white;
      font-family:Arial,sans-serif;
    `;

    screen.innerHTML = `
      <div style="
        width:min(92vw,440px);
        padding:32px;
        border-radius:18px;
        box-shadow:0 12px 45px rgba(0,0,0,.16);
        box-sizing:border-box;
        background:white;
      ">
        <h1>Welcome</h1>

        <p>
          Please enter your name before starting the training.
        </p>

        <input
          id="tracker-name"
          type="text"
          placeholder="Your name"
          autocomplete="name"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            font-size:16px;
            border:1px solid #bbb;
            border-radius:10px;
          "
        >

        <button
          id="tracker-start"
          style="
            width:100%;
            margin-top:12px;
            padding:12px;
            border:0;
            border-radius:10px;
            font-size:16px;
            cursor:pointer;
            background:#111;
            color:white;
          "
        >
          Start training
        </button>

        <div
          id="tracker-error"
          style="color:#b00020;margin-top:10px;"
        ></div>
      </div>
    `;

    document.body.appendChild(screen);

    const input = document.getElementById("tracker-name");
    const button = document.getElementById("tracker-start");
    const error = document.getElementById("tracker-error");

    function startTraining() {
      const enteredName = input.value.trim();

      if (!enteredName) {
        error.textContent = "Please enter your name.";
        input.focus();
        return;
      }

      name = enteredName;
      startedAt = new Date().toISOString();
      activeSeconds = 0;
      started = true;
      lastTick = Date.now();

      screen.remove();

      send("start");

      heartbeatTimer = setInterval(
        heartbeat,
        HEARTBEAT_MS
      );
    }

    button.addEventListener("click", startTraining);

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        startTraining();
      }
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (!started) return;

    if (document.hidden) {
      tick();
      send("inactive");
    } else {
      lastTick = Date.now();
      send("active");
    }
  });

  window.addEventListener("beforeunload", function () {
    if (!started) return;

    tick();
    send("leave");
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createScreen
    );
  } else {
    createScreen();
  }
})();