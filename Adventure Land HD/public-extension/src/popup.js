(function () {
  "use strict";
  var api = globalThis.browser || globalThis.chrome;
  var summary = document.getElementById("summary");
  var mode = document.getElementById("mode");
  var assets = document.getElementById("assets");
  var gpu = document.getElementById("gpu");
  var build = document.getElementById("build");
  var toggle = document.getElementById("toggle");

  async function activeTab() {
    var tabs = await api.tabs.query({active:true,currentWindow:true});
    return tabs && tabs[0];
  }

  async function pageStatus(tabId) {
    var results = await api.scripting.executeScript({
      target:{tabId:tabId},
      world:"MAIN",
      func:function () {
        return window.ALHD && typeof window.ALHD.status === "function" ? window.ALHD.status() : null;
      }
    });
    return results && results[0] ? results[0].result : null;
  }

  async function currentEnabled(tabId) {
    var results = await api.scripting.executeScript({
      target:{tabId:tabId},
      world:"MAIN",
      func:function () {
        try { return localStorage.getItem("alhd.public.enabled") !== "off"; }
        catch (_error) { return true; }
      }
    });
    return results && results[0] ? results[0].result !== false : true;
  }

  async function setEnabled(tabId, enabled) {
    await api.scripting.executeScript({
      target:{tabId:tabId},
      world:"MAIN",
      args:[enabled],
      func:function (value) {
        try { localStorage.setItem("alhd.public.enabled", value ? "on" : "off"); } catch (_error) {}
      }
    });
    await api.tabs.reload(tabId);
  }

  async function refresh() {
    var tab = await activeTab();
    if (!tab || !tab.id || !/^https:\/\/(?:www\.)?adventure\.land\//i.test(tab.url || "")) {
      summary.textContent = "Open adventure.land to use Adventure Land HD.";
      toggle.disabled = true;
      return;
    }
    var status = await pageStatus(tab.id);
    var enabled = await currentEnabled(tab.id);
    toggle.textContent = enabled ? "Disable HD" : "Enable HD";
    toggle.disabled = false;
    toggle.onclick = function () { setEnabled(tab.id,!enabled).catch(showError); };

    if (!status) {
      summary.textContent = "Adventure Land HD has not initialized on this page.";
      return;
    }

    mode.textContent = status.mode + " / " + status.reason;
    assets.textContent = status.applied + " applied · " + status.eligible + " eligible · " + status.available + " available";
    gpu.textContent = status.maxTextureSize ? String(status.maxTextureSize) + " px" : "not detected";
    build.textContent = status.buildId || "—";

    if (status.missing && status.missing.length) summary.textContent = status.missing.length + " compatible asset path(s) were not found in the current official client.";
    else if (status.blocked && status.blocked.length) summary.textContent = status.blocked.length + " HD asset(s) use original graphics because of the GPU texture limit.";
    else if (status.mode === "HD" && status.reason === "READY") summary.textContent = "HD presentation layer is active on the official client.";
    else summary.textContent = "Original graphics are active.";
  }

  function showError(error) {
    summary.textContent = error && error.message ? error.message : String(error);
  }

  refresh().catch(showError);
})();
