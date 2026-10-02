(function () {
  "use strict";

  const cfg = window.RISE_TRACKER_CONFIG || {};
  const ENDPOINT = cfg.endpoint || "";

  let started = false;
  let sessionId = "";

  function send(action, name) {
    if (!ENDPOINT) {
      console.error("Rise Tracker: No endpoint configured.");
      return;
    }

    const url =
      ENDPOINT +
      "?action=" +
      encodeURIComponent(action) +
      "&name=" +
      encodeURIComponent(name);

    console.log("Rise Tracker sending:", url);

    const img = new Image();

    img.onload = function () {
      console.log("Rise Tracker request sent.");
    };

    img.onerror = function () {
      console.log("Rise Tracker request completed.");
    };

    img.src = url;
  }

  function showWelcome() {
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
        width:90%;
        max-width:420px;
        padding:30px;
        background:white;
        border-radius:16px;
        box-shadow:0 10px 40px rgba(0,0,0,.15);
      ">

        <h2>Welcome</h2>

        <p>Please enter your name to start the training.</p>

        <input
          id="tracker-name"
          type="text"
          placeholder="Your name"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            font-size:16px;
            margin-bottom:12px;
          "
        >

        <button
          id="tracker-start"
          style="
            width:100%;
            padding:12px;
            font-size:16px;
            cursor:pointer;
          "
        >
          Start training
        </button>

      </div>
    `;

    document.body.appendChild(screen);

    const input = document.getElementById("tracker-name");
    const button = document.getElementById("tracker-start");

    button.onclick = function () {
      const name = input.value.trim();

      if (!name) {
        alert("Please enter your name.");
        return;
      }

      started = true;
      sessionId = Date.now().toString();

      send("start", name);

      screen.remove();

      // Store the name for closing
      window.RISE_TRACKER_NAME = name;
    };
  }

  window.addEventListener("pagehide", function () {
    if (started && window.RISE_TRACKER_NAME) {
      send("close", window.RISE_TRACKER_NAME);
    }
  });

  window.addEventListener("beforeunload", function () {
    if (started && window.RISE_TRACKER_NAME) {
      send("close", window.RISE_TRACKER_NAME);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showWelcome);
  } else {
    showWelcome();
  }

})();