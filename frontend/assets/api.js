/* ============================================================
   YU JUNXI / PRODUCT LAB — API 客户端
   说明：优先调用后端 FastAPI（/api/*）。若后端未启动（例如直接
   双击打开 HTML 文件），fetch 会失败，此时前端自动回退到 data.js
   里的本地数据，保证页面依然可用。
   ============================================================ */
(function () {
  "use strict";

  function base() {
    // 同源部署时为空字符串；前后端分离开部署时可改为后端地址，例如
    //   window.API_BASE = "https://api.example.com";
    return window.API_BASE || "";
  }

  function request(path, options) {
    return fetch(base() + path, options).then(function (res) {
      if (!res.ok) throw new Error("API " + res.status);
      return res.json();
    });
  }

  window.API = {
    base: base,
    bootstrap: function () { return request("/api/bootstrap"); },
    profile: function () { return request("/api/profile"); },
    projects: function () { return request("/api/projects"); },
    posts: function () { return request("/api/posts"); },

    jdMatch: function (text) {
      return request("/api/lab/jd/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      });
    },
    jdSamples: function () { return request("/api/lab/jd/samples"); },
    labCalls: function () { return request("/api/lab/calls"); },
    labCall: function (index) { return request("/api/lab/calls/" + encodeURIComponent(index)); },
    labDrawing: function () { return request("/api/lab/drawing"); }
  };
})();
