(function () {
  "use strict";

  var WHEEL_STAGE_SELECTOR = ".wheel-stage";
  var WHEEL_SELECTOR = "#wheel";
  var CENTER_CIRCLE_SELECTOR = "#wheelCenterCircle";
  var SEGMENT_SELECTOR = ".wheel-seg";
  var LOGO_SRC = "elyndra-logo.png";

  var ORDER = ["agua", "vida", "mente", "tierra", "fuego", "aire"];

  var FADE_MS = 2600;
  var HOLD_MS = 2000;
  var COOLDOWN_MS = 4000;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var history = [];
  var lastTriggered = 0;
  var styleInjected = false;

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;

    var css =
      ".elyndra-egg-overlay{position:absolute;z-index:500;border-radius:50%;" +
      "display:flex;align-items:center;justify-content:center;pointer-events:none;" +
      "background:radial-gradient(ellipse at center, rgba(10,20,32,.5), rgba(10,20,32,0) 72%);" +
      "opacity:0;transition:opacity " +
      FADE_MS +
      "ms ease;}" +
      ".elyndra-egg-overlay.elyndra-egg-in{opacity:1;}" +
      ".elyndra-egg-glow{position:absolute;width:74%;height:74%;border-radius:50%;" +
      "background:radial-gradient(circle, rgba(227,178,60,.5), rgba(90,169,214,.22) 40%, transparent 72%);" +
      "filter:blur(6px);opacity:0;transform:scale(.7);" +
      "transition:opacity " +
      FADE_MS +
      "ms ease, transform " +
      FADE_MS +
      "ms ease;}" +
      ".elyndra-egg-overlay.elyndra-egg-in .elyndra-egg-glow{opacity:1;transform:scale(1);}" +
      ".elyndra-egg-logo{position:relative;width:42%;opacity:0;transform:scale(.85);" +
      "filter:drop-shadow(0 0 18px rgba(227,178,60,.6));" +
      "transition:opacity " +
      FADE_MS +
      "ms ease " +
      Math.round(FADE_MS * 0.12) +
      "ms," +
      "transform " +
      FADE_MS +
      "ms ease " +
      Math.round(FADE_MS * 0.12) +
      "ms;}" +
      ".elyndra-egg-overlay.elyndra-egg-in .elyndra-egg-logo{opacity:1;transform:scale(1);}" +
      ".elyndra-egg-spark{position:absolute;width:3px;height:3px;border-radius:50%;" +
      "background:#e3b23c;opacity:0;pointer-events:none;left:50%;top:50%;}" +
      "@keyframes elyndraEggSpark{" +
      "0%{opacity:0;transform:translate(-50%,-50%) scale(.4);}" +
      "20%{opacity:1;}" +
      "100%{opacity:0;transform:var(--egg-end) scale(1);}}";

    var tag = document.createElement("style");
    tag.setAttribute("data-elyndra-egg", "");
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function buildSparks(container) {
    if (reduceMotion) return;
    var count = 14;
    for (var i = 0; i < count; i++) {
      var spark = document.createElement("span");
      spark.className = "elyndra-egg-spark";
      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      var dist = 34 + Math.random() * 70;
      var x = Math.cos(angle) * dist;
      var y = Math.sin(angle) * dist;
      spark.style.setProperty(
        "--egg-end",
        "translate(calc(-50% + " + x + "px), calc(-50% + " + y + "px))",
      );
      spark.style.animation =
        "elyndraEggSpark " +
        (1.4 + Math.random() * 0.8) +
        "s ease-out " +
        (Math.round(FADE_MS * 0.2) / 1000 + Math.random() * 0.5) +
        "s forwards";
      container.appendChild(spark);
    }
  }

  var VIEWBOX_SIZE = 300;
  var CENTER_CX = 150;
  var CENTER_CY = 150;
  var CENTER_R = 60;
  function getWheelRect() {
    var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var stage = document.querySelector(WHEEL_STAGE_SELECTOR);
    if (stage) {
      var stageRect = stage.getBoundingClientRect();
      if (stageRect.width && stageRect.height) {
        var scale = stageRect.width / VIEWBOX_SIZE;
        var diameter = CENTER_R * 2 * scale;
        var circleLeft = stageRect.left + (CENTER_CX - CENTER_R) * scale;
        var circleTop = stageRect.top + (CENTER_CY - CENTER_R) * scale;
        return {
          left: circleLeft + scrollX,
          top: circleTop + scrollY,
          width: diameter,
          height: diameter,
        };
      }
    }
    var el = document.querySelector(WHEEL_SELECTOR);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return {
      left: r.left + scrollX,
      top: r.top + scrollY,
      width: r.width,
      height: r.height,
    };
  }

  function triggerEasterEgg() {
    var now = Date.now();
    if (now - lastTriggered < COOLDOWN_MS) return;

    var rect = getWheelRect();
    if (!rect || !rect.width || !rect.height) return;
    lastTriggered = now;
    injectStyles();

    var overlay = document.createElement("div");
    overlay.className = "elyndra-egg-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";

    var glow = document.createElement("div");
    glow.className = "elyndra-egg-glow";
    overlay.appendChild(glow);

    buildSparks(overlay);

    var logo = document.createElement("img");
    logo.className = "elyndra-egg-logo";
    logo.src = LOGO_SRC;
    logo.alt = "";
    overlay.appendChild(logo);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("elyndra-egg-in");
      });
    });

    var fadeTime = reduceMotion ? 300 : FADE_MS;
    var holdTime = reduceMotion ? 1200 : HOLD_MS;

    setTimeout(function () {
      overlay.classList.remove("elyndra-egg-in");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, fadeTime);
    }, fadeTime + holdTime);
  }

  function registerProgress(key) {
    if (!key || ORDER.indexOf(key) === -1) return;
    var expected = ORDER[history.length];
    if (key === expected) {
      history.push(key);
      if (history.length === ORDER.length) {
        triggerEasterEgg();
        history = [];
      }
    } else {
      history = key === ORDER[0] ? [key] : [];
    }
  }

  function segmentFrom(el) {
    if (!el) return null;
    return el.closest ? el.closest(SEGMENT_SELECTOR) : null;
  }

  function onWheelClick(e) {
    var seg = segmentFrom(e.target);
    if (seg) registerProgress(seg.dataset ? seg.dataset.key : null);
  }

  function onWheelKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var seg = segmentFrom(e.target);
    if (seg) registerProgress(seg.dataset ? seg.dataset.key : null);
  }

  function init() {
    var wheel = document.querySelector(WHEEL_SELECTOR);
    if (!wheel) return;
    wheel.addEventListener("click", onWheelClick);
    wheel.addEventListener("keydown", onWheelKeydown);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
