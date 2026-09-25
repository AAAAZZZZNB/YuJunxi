/* ============================================================
   YU JUNXI / PRODUCT LAB — 交互层
   模块：导航 / 滚动动效 / 计数器 / 项目渲染 / 实验室 Demo
   ============================================================ */
(function () {
  "use strict";

  var P = window.PORTFOLIO || {};
  var page = document.body.getAttribute("data-page") || "home";

  /* ---------------- 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  function setHTML(el, html) { if (el) el.innerHTML = html; }
  function reduceMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function byId(id) {
    var list = P.projects || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () { el.classList.add("is-on"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2400);
  }

  /* ---------------- 导航 ---------------- */
  function initNav() {
    $$(".nav a, .mobile-nav a").forEach(function (a) {
      if (a.getAttribute("data-nav") === page) a.classList.add("is-active");
    });

    var burger = $(".burger");
    var panel = $(".mobile-nav");
    if (burger && panel) {
      burger.addEventListener("click", function () {
        var open = panel.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$("a", panel).forEach(function (a) {
        a.addEventListener("click", function () {
          panel.classList.remove("is-open");
          burger.classList.remove("is-open");
        });
      });
    }

    // 页内锚点：滚动时高亮当前区块（仅首页）
    var anchors = $$(".nav a[href^='#']");
    if (anchors.length && page === "home") {
      var sections = anchors
        .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
        .filter(Boolean);
      if (sections.length && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (!en.isIntersecting) return;
              var id = en.target.id;
              anchors.forEach(function (a) {
                a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
              });
            });
          },
          { rootMargin: "-45% 0px -50% 0px" }
        );
        sections.forEach(function (s) { io.observe(s); });
      }
    }
  }

  /* ---------------- 滚动出现 ---------------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion()) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var fired = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          fired = true;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach(function (el) { io.observe(el); });

    // 兜底：仅在观察器完全没有触发时才强制显示，避免破坏正常滚动动效
    setTimeout(function () {
      if (fired) return;
      items.forEach(function (el) { el.classList.add("is-in"); });
    }, 1500);
  }

  /* ---------------- 数字滚动 ---------------- */
  function animateNumber(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    if (reduceMotion()) {
      el.innerHTML = target.toFixed(decimals) + '<span>' + esc(suffix) + "</span>";
      return;
    }
    var duration = 1100;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = (target * eased).toFixed(decimals) + '<span>' + esc(suffix) + "</span>";
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length) return;
    if (!("IntersectionObserver" in window)) {
      nums.forEach(animateNumber);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          animateNumber(en.target);
          io.unobserve(en.target);
        });
      },
      { threshold: 0.4 }
    );
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------------- 能力条 ---------------- */
  function initBars() {
    var bars = $$(".cap-bar i, .match-track i");
    if (!bars.length) return;
    function fill(el) {
      var v = el.getAttribute("data-level") || "0";
      el.style.width = v + "%";
    }
    var capBars = $$(".cap-bar i");
    if (capBars.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            fill(en.target);
            io.unobserve(en.target);
          });
        },
        { threshold: 0.3 }
      );
      capBars.forEach(function (b) { io.observe(b); });
    } else {
      capBars.forEach(fill);
    }
    $$(".match-track i").forEach(function (b) {
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill(b); }); });
    });
  }

  /* ---------------- 首页：工作流控制台 ---------------- */
  function initConsole() {
    var steps = $$(".cstep");
    var state = $(".console-state");
    if (!steps.length) return;
    var idx = 0;

    function paint() {
      steps.forEach(function (s, i) {
        s.classList.toggle("is-done", i < idx);
        s.classList.toggle("is-on", i === idx);
        var st = $(".cstep-state", s);
        if (st) st.textContent = i < idx ? "DONE" : i === idx ? "BUILDING" : "NEXT";
      });
      if (state) {
        state.textContent =
          idx === 0 ? "STEP 01 / 04" : idx === 1 ? "STEP 02 / 04" : idx === 2 ? "STEP 03 / 04" : "STEP 04 / 04";
      }
    }
    paint();
    if (reduceMotion()) return;
    setInterval(function () {
      idx = idx >= steps.length ? 0 : idx + 1;
      if (idx === steps.length) idx = 0;
      paint();
    }, 2200);
  }

  /* ---------------- 渲染：首页指标 ---------------- */
  function renderMetrics() {
    var host = $("[data-render='metrics']");
    if (!host) return;
    host.innerHTML = (P.metrics || [])
      .map(function (m, i) {
        return (
          '<div class="metric reveal" data-delay="' + i + '">' +
          '<b data-count="' + m.value + '" data-decimals="' + (m.decimals || 0) + '" data-suffix="' + esc(m.suffix || "") + '">0</b>' +
          "<p>" + esc(m.label) + "</p>" +
          "<small>" + esc(m.note) + "</small>" +
          '<small class="metric-ctx">' + esc(m.context) + "</small>" +
          "</div>"
        );
      })
      .join("");
  }

  /* ---------------- 渲染：首页能力矩阵 ---------------- */
  function renderCapabilities() {
    var host = $("[data-render='capabilities']");
    if (!host) return;
    host.innerHTML = (P.capabilities || [])
      .map(function (c, i) {
        return (
          '<div class="cap-card reveal" data-delay="' + i + '">' +
          '<h3><span class="cap-icon">' + esc(c.icon) + "</span>" + esc(c.title) + "</h3>" +
          "<ul>" +
          c.items
            .map(function (it) {
              return (
                '<li class="cap-item">' +
                "<small>" + esc(it.name) + "<em>" + it.level + "</em></small>" +
                '<div class="cap-bar"><i data-level="' + it.level + '"></i></div>' +
                "</li>"
              );
            })
            .join("") +
          "</ul></div>"
        );
      })
      .join("");
  }

  /* ---------------- 渲染：项目卡片 ---------------- */
  function artFor(p) {
    if (p.id === "outbound") {
      return (
        '<div class="work-art-label">AI CALL QUALITY</div>' +
        '<div class="mini-dash"><div class="mini-bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="mini-stat"><small>SUCCESS RATE</small><strong>86.4%</strong><em>↑ 12.8%</em></div></div>'
      );
    }
    if (p.id === "drawing") {
      return (
        '<div class="work-art-label">MULTIMODAL OCR</div>' +
        '<div class="blueprint">' +
        '<i class="line l1"></i><i class="line l2"></i><i class="line l3"></i>' +
        '<b class="node n1"></b><b class="node n2"></b><b class="node n3"></b>' +
        "<small>CABLE ROUTE / SHEET G-02</small></div>"
      );
    }
    if (p.id === "cloud") {
      return (
        '<div class="work-art-label">RAG / KNOWLEDGE</div>' +
        '<div class="flow-chip"><b>DOCS</b><i>→</i><strong>RAG</strong><i>→</i><b>ANSWER</b></div>' +
        '<div class="mini-stat"><small>CHUNK / OVERLAP</small><strong>512 / 96</strong></div>'
      );
    }
    return (
      '<div class="work-art-label">' + esc(p.thumbLabel) + "</div>" +
      '<div class="mini-stat"><small>' + esc(p.en) + "</small><strong>" + esc(p.monogram) + "</strong></div>"
    );
  }

  function renderWorkCards() {
    var host = $("[data-render='work']");
    if (!host) return;
    var list = (P.projects || []).filter(function (p) { return p.featured; });
    host.innerHTML = list
      .map(function (p, i) {
        return (
          '<a class="work-card reveal" data-delay="' + i + '" href="project.html?id=' + esc(p.id) + '">' +
          '<div class="work-art work-art--' + esc(p.accent) + '">' + artFor(p) + "</div>" +
          '<div class="work-info">' +
          '<div class="work-meta"><span>0' + (i + 1) + " / " + esc(p.category[0]) + "</span><span>" + esc(p.org) + "</span></div>" +
          "<h3>" + esc(p.title) + "</h3>" +
          "<p>" + esc(p.summary) + "</p>" +
          '<div class="tag-row">' +
          p.tags.slice(0, 3).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
          "</div>" +
          '<span class="work-link">查看案例</span>' +
          "</div></a>"
        );
      })
      .join("");
  }

  /* ---------------- 渲染：首页精选结果条 ---------------- */
  function renderMarquee() {
    var host = $("[data-render='orgs']");
    if (!host) return;
    var orgs = ["京东", "华南理工大学", "广州浩传网络科技", "广东诚泰交通科技", "广州市交通规划研究院"];
    host.innerHTML = orgs
      .map(function (o) { return "<span>" + esc(o) + "</span>"; })
      .join("");
  }

  /* ---------------- 简历页：工作台 ---------------- */

  function articleHTML(state) {
    return (
      '<div class="tl-item' + (state.current ? " is-current" : "") + '">' +
      '<span class="tl-time">' + esc(state.time) + "</span>" +
      "<h3>" + esc(state.org) + " <small>" + esc(state.role) + "</small></h3>" +
      "<p>" + esc(state.summary) + "</p>" +
      (state.points && state.points.length
        ? '<ul class="tl-points">' +
          state.points.map(function (pt) { return "<li>" + pt + "</li>"; }).join("") +
          "</ul>"
        : "") +
      (state.tags && state.tags.length
        ? '<div class="tag-row">' +
          state.tags.map(function (g) { return '<span class="tag">' + esc(g) + "</span>"; }).join("") +
          "</div>"
        : "") +
      "</div>"
    );
  }

  var RESUME_META = {
    profile: {
      num: "01 / PROFILE",
      title: "个人定位",
      badge: "核心摘要",
      lead: "一句话定位 + 职业摘要 + 求职意向，招聘方在 30 秒内就能判断是否继续往下看。",
      summary: "AI 产品经理 / 产品工程实践者 / 交通科技研究者"
    },
    work: {
      num: "02 / EXPERIENCE",
      title: "工作与实习",
      badge: "4 段经历",
      lead: "按时间倒序排列，每段经历都写明「负责什么 + 带来什么变化」，而不是罗列职责。",
      summary: "京东 · 广州浩传 · 广东诚泰 · 广州市交通规划研究院"
    },
    projects: {
      num: "03 / PROJECTS",
      title: "代表项目",
      badge: "8 个案例",
      lead: "每个项目都可以点开查看完整的背景、问题、角色、方案、实现与结果。",
      summary: "从 AI 产品到交通科技，覆盖 4 个能力方向"
    },
    education: {
      num: "04 / EDUCATION",
      title: "教育经历",
      badge: "硕士在读",
      lead: "华南理工大学本硕一致，研究方向聚焦混合交通流与交通安全评估。",
      summary: "本科 GPA 3.63 · 专业前 30%"
    },
    awards: {
      num: "05 / AWARDS",
      title: "奖项与荣誉",
      badge: "10 项",
      lead: "包含学科竞赛、奖学金与荣誉，均为可公开的正式奖项。",
      summary: "国家级 4 项 · 省级 1 项 · 校级 5 项"
    },
    skills: {
      num: "06 / SKILLS",
      title: "技能与能力",
      badge: "4 类",
      lead: "产品、AI、数据、工程四个方向，每项都能对应到具体项目中的使用场景。",
      summary: "工具只是手段，重点是知道什么时候该用哪一个"
    },
    campus: {
      num: "07 / CAMPUS",
      title: "校园经历与个人兴趣",
      badge: "2 段经历",
      lead: "校园组织经历与日常兴趣，用于补充工作之外的协作方式与做事节奏。",
      summary: "交通科技协会副会长 · 学院学术部成员"
    }
  };

  function resumeSection(id) {
    var work = (P.timeline || []).filter(function (t) { return t.type === "work"; });
    var campus = (P.timeline || []).filter(function (t) { return t.type === "campus"; });

    if (id === "profile") {
      return (
        '<div class="card">' +
        '<div class="profile-row"><div class="avatar">余</div><div>' +
        "<h3>余俊曦 <span class=\"mono muted\" style=\"font-size:12px;letter-spacing:.1em\">YU JUNXI</span></h3>" +
        "<p>AI 产品经理 · 产品工程实践者 · 交通科技研究者</p>" +
        "<small>广州 · 华南理工大学 · 交通运输规划与管理 硕士在读</small>" +
        "</div></div>" +
        '<p class="summary">' + esc(P.profile.shortIntro) + "</p>" +
        '<p class="summary">关注的不是「做过什么功能」，而是「问题有没有被真正解决」。' +
        "习惯先定义指标与验收标准，再用 Vibe Coding 把方案做成能被验证的东西。</p>" +
        '<div class="tag-row mt-24">' +
        ["AI 产品 0→1", "RAG / Prompt 工程", "多模态识别", "B 端业务系统", "Vibe Coding"]
          .map(function (t) { return '<span class="tag tag--teal">' + esc(t) + "</span>"; })
          .join("") +
        "</div>" +
        '<div class="block-title mt-40">JOB TARGET</div>' +
        '<ul class="stat-list">' +
        "<li><b>方向</b><span>AI 产品经理 / AI 应用产品 / B 端产品经理</span></li>" +
        "<li><b>城市</b><span>广州 · 深圳 · 可远程沟通</span></li>" +
        "<li><b>状态</b><span>硕士在读（2027.06 预计毕业），可安排实习</span></li>" +
        "<li><b>优势</b><span>能把 AI 能力翻译成业务流程，也能自己动手做原型</span></li>" +
        "</ul>" +
        '<div class="block-title mt-40">HIGHLIGHTS</div>' +
        '<ul class="stat-list">' +
        "<li><b>0→1</b><span>AI 产品完整流程：需求、指标、工作流、上线</span></li>" +
        "<li><b>8+</b><span>推动 AI 外呼语音迭代需求落地</span></li>" +
        "<li><b>6</b><span>整合业务系统数据，客服查询效率 +10%</span></li>" +
        "<li><b>5.3万</b><span>月处理客服工单规模</span></li>" +
        "<li><b>17.1%</b><span>地下物流模型碳排放降低</span></li>" +
        "</ul>" +
        '<div class="notice mt-40"><i>◈</i><span>' +
        "本页内容已按公开边界脱敏：不展示身份证、手机号、私人社交账号、家庭信息与健康信息；" +
        "企业数据仅保留可公开的比例、规模与目标值。</span></div>" +
        "</div>"
      );
    }

    if (id === "work") {
      return '<div class="card"><div class="tl">' + work.map(articleHTML).join("") + "</div></div>";
    }

    if (id === "projects") {
      return (
        '<div class="card"><div class="stack-sm">' +
        (P.projects || [])
          .map(function (p, i) {
            return (
              '<a class="call-item" href="project.html?id=' + esc(p.id) + '">' +
              "<b>" + (i < 9 ? "0" : "") + (i + 1) + "</b>" +
              "<span>" + esc(p.title) + "<small>" + esc(p.role) + " · " + esc(p.org) + " · " + esc(p.period) + "</small></span>" +
              '<span class="sev sev--low">' + esc(p.category[0]) + "</span></a>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="notice mt-24"><i>◈</i><span>' +
        "每个项目的企业数据均已脱敏；缺少细节的位置会在正文中明确标注，不做夸大表述。</span></div>" +
        "</div>"
      );
    }

    if (id === "education") {
      return (
        '<div class="card">' +
        '<div class="edu-grid">' +
        (P.education || [])
          .map(function (e) {
            return (
              '<div class="edu-card"><small>' + esc(e.time) + "</small>" +
              "<h3>" + esc(e.school) + "</h3>" +
              "<p>" + esc(e.major) + "</p>" +
              "<em>" + e.extra + "</em></div>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="block-title mt-40">RESEARCH</div>' +
        '<ul class="stat-list">' +
        "<li><b>硕士</b><span>混合交通流（自动驾驶与自然驾驶）跟驰换道模型；基于极值模型的真实与仿真交通轨迹交通安全评估</span></li>" +
        "<li><b>本科</b><span>基于深度学习的交通预测：图神经网络、RNN、Transformer</span></li>" +
        "</ul>" +
        '<div class="block-title mt-40">COURSES</div>' +
        '<div class="tag-row">' +
        ["交通规划", "Python 语言基础", "交通数据分析", "企业管理", "财务管理"]
          .map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; })
          .join("") +
        "</div></div>"
      );
    }

    if (id === "awards") {
      return (
        '<div class="card">' +
        (P.awards || [])
          .map(function (a) {
            return (
              '<div class="award-row"><div><b>' + esc(a.name) + "</b><small>" + esc(a.meta) + "</small></div>" +
              '<span class="tag">' + esc(a.level) + "</span></div>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    if (id === "skills") {
      return (
        '<div class="grid-2">' +
        (P.skills || [])
          .map(function (g) {
            return (
              '<div class="skill-block"><h4>' + esc(g.group) + "<span>" + esc(g.group).toUpperCase() + "</span></h4>" +
              '<div class="tag-row">' +
              g.items.map(function (it) { return '<span class="tag">' + esc(it) + "</span>"; }).join("") +
              "</div></div>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="card mt-40"><div class="block-title">LANGUAGES & TOOLS</div><div class="tag-row">' +
        ["CET-6", "Python", "SQL", "R", "SPSS", "Stata", "Axure", "Visio", "ArcGIS", "Vibe Coding"]
          .map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; })
          .join("") +
        "</div>" +
        '<p class="muted mt-24" style="font-size:12.5px;line-height:1.7">' +
        "完整奖项名称、准确的实习起止时间与可公开素材仍在补充确认中，会在下一版更新。</p></div>"
      );
    }

    if (id === "campus") {
      return (
        '<div class="card"><div class="tl">' + campus.map(articleHTML).join("") + "</div></div>" +
        '<div class="contact-grid mt-40">' +
        (P.interests || [])
          .map(function (it) {
            return (
              '<div class="contact-card"><small>' + esc(it.icon) + "</small>" +
              "<b>" + esc(it.title) + "</b><p>" + esc(it.desc) + "</p></div>"
            );
          })
          .join("") +
        "</div>"
      );
    }
    return "";
  }

  function initResumeWorkbench() {
    var rail = $("#resumeRail");
    var stage = $("#resumeStage");
    if (!rail || !stage) return;

    var ids = Object.keys(RESUME_META);

    function renderOverview() {
      var cards = ids
        .map(function (id) {
          var m = RESUME_META[id];
          var previews = {
            profile: ["AI 产品经理 · 产品工程实践者 · 交通科技研究者", "广州 · 华南理工大学 硕士在读"],
            work: ["京东 · 产品 / AI 产品实践（2025 — 至今）", "广州浩传网络科技 · 产品经理（2025.12 — 2026.04）"],
            projects: ["AI 预约外呼智能分析平台 · 产品负责人", "通信图纸 AI 智能录入系统 · 项目负责人"],
            education: ["华南理工大学 · 交通运输规划与管理（硕士）", "华南理工大学 · 交通运输（本科，GPA 3.63）"],
            awards: ["国家励志奖学金 ×3 · 北京市挑战杯银奖", "全国大学生交通运输科技大赛优秀奖"],
            skills: ["产品 / AI / 数据 / 工程 四类能力", "Prompt、RAG、OCR、Python、SQL、ArcGIS"],
            campus: ["交通科技协会副会长 · 学院学术部成员", "跑步 · 篮球 · 书法 · Vibe Coding 实验"]
          }[id] || [];

          return (
            '<article class="resume-card' + (id === "profile" ? " is-wide" : "") + '" data-sec="' + esc(id) + '" role="button" tabindex="0">' +
            '<div class="rc-top"><span class="rc-num">' + esc(m.num) + "</span>" +
            '<span class="rc-badge">' + esc(m.badge) + "</span></div>" +
            "<h3>" + esc(m.title) + "</h3>" +
            "<p>" + esc(m.summary) + "</p>" +
            '<div class="rc-preview">' +
            previews.map(function (p) { return "<span>" + esc(p) + "</span>"; }).join("") +
            "</div>" +
            '<span class="rc-more">查看详情</span>' +
            "</article>"
          );
        })
        .join("");

      stage.innerHTML =
        '<div class="stage-head"><div>' +
        '<span class="kicker">RESUME WORKSPACE</span>' +
        '<h2 class="mt-24">选择想先看的栏目。</h2>' +
        '<p class="stage-lead">七个栏目各自独立，点击卡片或左侧导航进入具体内容。' +
        "招聘方通常先看「个人定位」和「工作与实习」，技术面可以直跳「代表项目」。</p>" +
        "</div></div>" +
        '<div class="overview-grid">' + cards + "</div>";
    }

    function renderSection(id) {
      var m = RESUME_META[id];
      stage.innerHTML =
        '<div class="stage-head"><div>' +
        '<span class="kicker">' + esc(m.num) + "</span>" +
        "<h2 class=\"mt-24\">" + esc(m.title) + "</h2>" +
        '<p class="stage-lead">' + esc(m.lead) + "</p>" +
        "</div>" +
        '<button class="back-btn" data-back>← 返回总览</button>' +
        "</div>" +
        resumeSection(id);
    }

    function select(id, updateHash) {
      if (ids.indexOf(id) < 0) id = "";
      $$(".rail-item", rail).forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-sec") === id);
      });
      if (id) renderSection(id);
      else renderOverview();
      if (updateHash) {
        try {
          history.replaceState(null, "", id ? "#" + id : location.href.split("#")[0]);
        } catch (err) {
          location.hash = id || "";
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function bind(el) {
      $$("[data-sec]", el).forEach(function (btn) {
        btn.addEventListener("click", function () { select(btn.getAttribute("data-sec"), true); });
      });
      var back = $("[data-back]", el);
      if (back) back.addEventListener("click", function () { select("", true); });
    }

    bind(rail);
    stage.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-sec], [data-back]") : null;
      if (!btn) return;
      if (btn.hasAttribute("data-back")) select("", true);
      else select(btn.getAttribute("data-sec"), true);
    });
    stage.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var btn = e.target.closest ? e.target.closest("[data-sec]") : null;
      if (!btn) return;
      e.preventDefault();
      select(btn.getAttribute("data-sec"), true);
    });

    window.addEventListener("hashchange", function () {
      select(location.hash.replace("#", ""), false);
    });

    select(location.hash.replace("#", ""), false);

    // 打印时（浏览器 Ctrl + P）预先渲染完整版，保证内容齐全
    var printHost = $("[data-render='print-all']");
    if (printHost) {
      printHost.innerHTML =
        '<p class="print-title" style="margin-bottom:18px;font-size:12px;color:#5a6678">' +
        esc(P.profile.name) + " · " + esc(P.profile.roles.join(" / ")) + " · " + esc(P.profile.city) +
        "</p>" +
        ids
          .map(function (id) {
            var m = RESUME_META[id];
            return (
              '<section style="margin-bottom:26px;break-inside:avoid">' +
              '<div class="block-title">' + esc(m.num) + " · " + esc(m.title) + "</div>" +
              resumeSection(id) +
              "</section>"
            );
          })
          .join("");
    }

  }

  /* ---------------- 项目列表 ---------------- */
  function initProjects() {
    var host = $("[data-render='projects']");
    if (!host) return;

    var cats = ["全部"];
    (P.projects || []).forEach(function (p) {
      p.category.forEach(function (c) { if (cats.indexOf(c) < 0) cats.push(c); });
    });

    var onScroll = function () {
      var cards = $$(".proj-card.reveal:not(.is-in)");
      if (!cards.length || !("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.06 });
      cards.forEach(function (c) { io.observe(c); });
    };

    function draw(filter) {
      var list = (P.projects || []).filter(function (p) {
        return filter === "全部" || p.category.indexOf(filter) >= 0;
      });
      host.innerHTML = list
        .map(function (p) {
          return (
            '<a class="proj-card reveal" href="project.html?id=' + esc(p.id) + '">' +
            '<div class="proj-thumb proj-thumb--' + esc(p.accent) + '"><span style="position:relative;z-index:1">' + esc(p.monogram) + "</span></div>" +
            '<div class="proj-body">' +
            '<div class="work-meta"><span>' + esc(p.period) + "</span><span>" + esc(p.org) + "</span></div>" +
            "<h3>" + esc(p.title) + "</h3>" +
            "<p>" + esc(p.summary) + "</p>" +
            '<div class="tag-row">' +
            p.category.map(function (c) { return '<span class="tag tag--teal">' + esc(c) + "</span>"; }).join("") +
            "</div>" +
            '<div class="proj-foot"><small>' + esc(p.role) + '</small><span class="work-link">查看案例</span></div>' +
            "</div></a>"
          );
        })
        .join("");
      onScroll();
    }

    var bar = $("[data-filter='projects']");
    if (bar) {
      bar.innerHTML = cats
        .map(function (c, i) {
          return '<button class="filter-btn' + (i === 0 ? " is-active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
        })
        .join("");
      $$("button", bar).forEach(function (btn) {
        btn.addEventListener("click", function () {
          $$("button", bar).forEach(function (b) { b.classList.toggle("is-active", b === btn); });
          draw(btn.getAttribute("data-cat"));
        });
      });
    }
    draw("全部");
  }

  /* ---------------- 项目详情 ---------------- */
  function initProjectDetail() {
    var host = $("[data-detail-body]");
    if (!host) return;

    var id = new URLSearchParams(window.location.search).get("id");
    var p = byId(id) || (P.projects || [])[0];
    if (!p) return;

    document.title = p.title + " · 余俊曦 Product Lab";

    var crumb = $("[data-crumb]");
    if (crumb) crumb.textContent = p.title;

    var head = $("[data-detail-head]");
    if (head) {
      head.innerHTML =
        '<span class="kicker">' + esc(p.category.join(" · ")) + "</span>" +
        "<h1>" + esc(p.title) + "</h1>" +
        '<p class="lead">' + esc(p.problemStatement) + "</p>" +
        '<div class="tag-row mt-24">' +
        p.tags.map(function (t) { return '<span class="tag tag--teal">' + esc(t) + "</span>"; }).join("") +
        "</div>" +
        '<div class="fact-grid">' +
        '<div class="fact"><small>MY ROLE</small><b>' + esc(p.role) + "</b></div>" +
        '<div class="fact"><small>ORGANIZATION</small><b>' + esc(p.org) + "</b></div>" +
        '<div class="fact"><small>PERIOD</small><b>' + esc(p.period) + "</b></div>" +
        '<div class="fact"><small>TRACK</small><b>' + esc(p.category.join(" / ")) + "</b></div>" +
        "</div>";
    }

    function paras(arr) {
      return (arr || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    }

    var body = $("[data-detail-body]");
    if (body) {
      var s = p.sections || {};
      body.innerHTML =
        '<section class="sec"><span class="sec-num">01 / 背景</span><h2>为什么做这件事</h2>' + paras(s.background) + "</section>" +
        '<section class="sec"><span class="sec-num">02 / 问题</span><h2>原流程的痛点</h2><div class="point-list">' +
        (s.problems || [])
          .map(function (x, i) {
            return (
              '<div class="point"><b>P' + (i + 1) + "</b><div><b>" + esc(x.t) + "</b><p>" + esc(x.d) + "</p></div></div>"
            );
          })
          .join("") +
        "</div></section>" +
        '<section class="sec"><span class="sec-num">03 / 我的角色</span><h2>我负责什么</h2><ul class="tl-points">' +
        (s.role || []).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") +
        "</ul></section>" +
        '<section class="sec"><span class="sec-num">04 / 产品方案</span><h2>我如何拆解与设计</h2><div class="pipe">' +
        (s.solution || [])
          .map(function (x) {
            return (
              '<div class="pipe-step"><small>' + esc(x.n) + "</small><b>" + esc(x.t) + "</b><p>" + esc(x.d) + "</p></div>"
            );
          })
          .join("") +
        "</div></section>" +
        '<section class="sec"><span class="sec-num">05 / 实现</span><h2>AI 与工程如何协同</h2><ul class="tl-points">' +
        (s.implementation || []).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") +
        "</ul></section>" +
        '<section class="sec"><span class="sec-num">06 / 结果</span><h2>带来了什么变化</h2><div class="result-grid">' +
        (s.results || [])
          .map(function (x) {
            return '<div class="result-cell"><b>' + esc(x.v) + "</b><span>" + esc(x.l) + "</span></div>";
          })
          .join("") +
        "</div>" + paras(s.resultsText) + "</section>" +
        '<section class="sec"><span class="sec-num">07 / 复盘与下一步</span><h2>如果重做一次</h2><div class="callout"><b>复盘结论</b><ul class="tl-points">' +
        (s.retro || []).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") +
        "</ul></div></section>";
    }

    // 侧栏：其他项目
    var side = $("[data-detail-side]");
    if (side) {
      var others = (P.projects || []).filter(function (x) { return x.id !== p.id; }).slice(0, 5);
      side.innerHTML =
        '<div class="side-card"><h4>PROJECT INDEX</h4><div class="side-links">' +
        others
          .map(function (x) {
            return (
              '<a href="project.html?id=' + esc(x.id) + '">' + esc(x.title) +
              "<span>" + esc(x.period.split(" ")[0]) + "</span></a>"
            );
          })
          .join("") +
        "</div></div>" +
        '<div class="side-card"><h4>KEY RESULTS</h4><ul class="stat-list">' +
        (p.metrics || [])
          .map(function (m) { return "<li><b>" + esc(m.v) + "</b><span>" + esc(m.l) + "</span></li>"; })
          .join("") +
        "</ul></div>" +
        '<div class="side-card"><h4>NEXT STEP</h4><p style="font-size:13.5px;color:var(--text-3)">想看完整职业档案与教育背景？</p>' +
        '<a class="btn btn--ghost btn--sm btn--block mt-24" href="resume.html">阅读简历 <span>↗</span></a></div>';
    }
  }

  /* ---------------- 实验室：JD 匹配 ---------------- */
  var jdHits = {};

  function matchKeyword(text, compact, kw) {
    var k = kw.replace(/\s+/g, "").toLowerCase();
    if (/^[a-z0-9+]{1,3}$/.test(k)) {
      return text.toLowerCase().split(/[^a-z0-9+]+/).indexOf(k) >= 0;
    }
    return compact.indexOf(k) >= 0;
  }

  function analyzeJD(raw) {
    var text = (raw || "").toLowerCase();
    var compact = text.replace(/\s+/g, "");
    var dims = P.lab.jdDimensions;
    var result = dims.map(function (d) {
      var hits = d.keywords.filter(function (k) { return matchKeyword(text, compact, k); });
      var score = hits.length === 0 ? 20 : Math.min(100, Math.round(42 + hits.length * 11));
      return { key: d.key, name: d.name, weight: d.weight, hits: hits, score: score };
    });
    return { text: raw, dims: result, compact: compact };
  }

  var dimAdvice = {
    ai: {
      project: "cloud",
      question: "你如何控制 RAG 的幻觉？切片策略是怎么定的？",
      answer: "用筑云智库的切片策略（512 / 96，按段落逻辑切分）与分数阈值来回答，说明你如何用工程手段约束模型行为。"
    },
    product: {
      project: "outbound",
      question: "这个平台为什么值得做？你如何定义第一版的边界？",
      answer: "用 AI 外呼平台说明 0→1 的判断：先解决人工抽查覆盖率低这个最痛的点，再扩展到预警与需求联动。"
    },
    data: {
      project: "jd-fulfillment",
      question: "你如何设计指标并做归因？",
      answer: "用统一查询整合 6 个系统、客服效率提升 10% 的案例，说明你如何把模糊问题变成可比指标。"
    },
    engineer: {
      project: "drawing",
      question: "你不是研发，怎么和算法同学对齐方案？",
      answer: "用图纸识别项目说明你如何定义预处理、检测与 OCR 的目标值，并用 Vibe Coding 搭出可验证的原型。"
    },
    industry: {
      project: "logistics",
      question: "你如何理解这个行业的业务约束？",
      answer: "用地下物流建模或交通规划院经历，说明你能读懂专业场景并把它翻译成产品语言。"
    },
    collab: {
      project: "jd-fulfillment",
      question: "跨部门推进受阻时你会怎么做？",
      answer: "用搬家业务开城与计薪合规的例子，说明你如何用临时方案 + 长期方案同时解决紧急与根本问题。"
    }
  };

  function projectScores(hitKeys) {
    var map = {
      ai: ["cloud", "outbound", "drawing"],
      product: ["outbound", "cloud", "jd-fulfillment"],
      data: ["outbound", "jd-fulfillment", "logistics"],
      engineer: ["drawing", "outbound", "robot-dog"],
      industry: ["jd-fulfillment", "drawing", "logistics", "robot-dog"],
      collab: ["jd-fulfillment", "digital-human", "guiyan"]
    };
    var score = {};
    hitKeys.forEach(function (k) {
      (map[k] || []).forEach(function (pid, i) { score[pid] = (score[pid] || 0) + (3 - i); });
    });
    return Object.keys(score)
      .sort(function (a, b) { return score[b] - score[a]; })
      .slice(0, 3)
      .map(function (pid) { return { id: pid, score: score[pid], reasons: hitKeys }; });
  }

  function pickRole(hitKeys) {
    var best = null;
    (P.lab.jdRoles || []).forEach(function (r) {
      var hit = r.need.filter(function (n) { return hitKeys.indexOf(n) >= 0; });
      var pct = hit.length / r.need.length;
      var value = pct * 100 + hit.length * 8;
      if (!best || value > best.value) best = { role: r, value: value, matched: hit, pct: pct };
    });
    return best;
  }

  function enrichAnalysis(analysis) {
    var hitKeys = analysis.dims.filter(function (d) { return d.hits.length > 0; }).map(function (d) { return d.key; });
    var allKeywords = [];
    analysis.dims.forEach(function (d) { allKeywords = allKeywords.concat(d.hits); });
    var best = hitKeys.length ? pickRole(hitKeys) : null;
    var projs = hitKeys.length ? projectScores(hitKeys) : [];
    var missing = best ? (best.role.need || []).filter(function (n) { return hitKeys.indexOf(n) < 0; }) : [];
    return { dims: analysis.dims, hitKeys: hitKeys, allKeywords: allKeywords, best: best, projs: projs, missing: missing };
  }

  function renderMatchReport(analysis, host) {
    var hitKeys = analysis.hitKeys;
    var allKeywords = analysis.allKeywords;

    if (!hitKeys || hitKeys.length === 0) {
      host.innerHTML =
        '<div class="empty-state"><b>△</b><p>没有识别到有效信息</p>' +
        '<small>请粘贴更完整的岗位描述（职责 + 任职要求）</small></div>';
      return;
    }

    var best = analysis.best;
    var projs = analysis.projs;
    var missing = analysis.missing;

    var html = "";
    html +=
      '<div class="report-head"><span class="badge">ANALYSIS DONE</span>' +
      "<div><h4>岗位类型判断</h4><small>基于关键词命中与能力权重，本地规则模拟</small></div></div>";

    html +=
      '<div class="report-block"><small>岗位类型</small>' +
      '<div class="kv"><b>最匹配</b><span><strong style="color:var(--teal)">' + esc(best.role.type) + "</strong> · " + esc(best.role.desc) + "</span></div>" +
      '<div class="kv"><b>判断依据</b><span>' + esc(best.matched.map(function (m) { return dimName(m); }).join(" + ")) + " 同时命中</span></div>" +
      '<div class="kv"><b>命中关键词</b><span class="tag-row">' +
      allKeywords.slice(0, 14).map(function (k) { return '<span class="tag tag--teal">' + esc(k) + "</span>"; }).join("") +
      "</span></div></div>";

    html += '<div class="report-block"><small>能力匹配度</small>';
    analysis.dims.forEach(function (d) {
      var cls = d.score >= 70 ? "" : d.score >= 50 ? " is-mid" : " is-low";
      html +=
        '<div class="match-row"><div><span>' + esc(d.name) + "</span><em>" + d.score + "%</em></div>" +
        '<div class="match-track' + cls + '"><i data-level="' + d.score + '"></i></div></div>';
    });
    html += "</div>";

    html += '<div class="report-block"><small>推荐优先展示的项目</small><div class="stack-sm">';
    projs.forEach(function (sp, i) {
      var p = byId(sp.id);
      if (!p) return;
      html +=
        '<a class="call-item" href="project.html?id=' + esc(p.id) + '" style="grid-template-columns:34px 1fr auto">' +
        "<b>0" + (i + 1) + "</b><span>" + esc(p.title) + "<small>" + esc(p.summary) + "</small></span>" +
        '<span class="sev sev--low">匹配 ' + Math.min(99, 62 + sp.score * 4) + "%</span></a>";
    });
    html += "</div></div>";

    html += '<div class="report-block"><small>面试准备建议</small><div class="stack-sm">';
    best.matched.forEach(function (k) {
      var a = dimAdvice[k];
      if (!a) return;
      var p = byId(a.project);
      html +=
        '<div style="border-left:2px solid var(--teal);padding-left:14px">' +
        '<div style="font-size:14px;margin-bottom:4px"><b>预计会被问到</b>：' + esc(a.question) + "</div>" +
        '<p style="font-size:13.5px;color:var(--text-3)">建议用「' + esc(p ? p.title : "") + "」作答：" + esc(a.answer) + "</p></div>";
    });
    if (missing.length) {
      html +=
        '<div style="border-left:2px solid var(--orange);padding-left:14px">' +
        '<div style="font-size:14px;margin-bottom:4px"><b>需要主动补齐</b>：岗位强调 ' +
        esc(missing.map(dimName).join("、")) + "</div>" +
        '<p style="font-size:13.5px;color:var(--text-3)">这部分不是你的主叙事，建议准备一句话说明「了解边界 + 如何快速补齐」，避免在面试中被追问时失分。</p></div>';
    }
    html += "</div></div>";

    html +=
      '<p class="muted" style="font-size:12px;font-family:var(--mono);letter-spacing:.06em;margin-top:22px">' +
      "NOTE · 本 Demo 使用本地关键词规则模拟分析结果，未调用真实模型。接入真实模型后可将该模块替换为 LLM 推理。</p>";

    host.innerHTML = '<div class="report">' + html + "</div>";
    setTimeout(initBars, 40);
  }

  function dimName(key) {
    var d = (P.lab.jdDimensions || []).filter(function (x) { return x.key === key; })[0];
    return d ? d.name : key;
  }

  function initLabMatcher() {
    var input = $("#jdInput");
    var run = $("#runMatch");
    var host = $("#matchOutput");
    if (!input || !run || !host) return;

    var sampleHost = $("#jdSamples");
    if (sampleHost) {
      sampleHost.innerHTML = (P.lab.jdSamples || [])
        .map(function (s, i) { return '<button class="sample" data-idx="' + i + '">' + esc(s.label) + "</button>"; })
        .join("");
      $$("button", sampleHost).forEach(function (b) {
        b.addEventListener("click", function () {
          input.value = P.lab.jdSamples[parseInt(b.getAttribute("data-idx"), 10)].text;
          input.focus();
        });
      });
    }

    var stages = ["解析岗位描述", "匹配能力维度", "检索相关项目", "生成准备建议"];
    var running = false;

    run.addEventListener("click", async function () {
      if (running) return;
      var text = input.value.trim();
      if (text.length < 12) {
        toast("请粘贴一段更完整的岗位描述");
        input.focus();
        return;
      }
      running = true;
      run.setAttribute("disabled", "disabled");
      run.innerHTML = "分析中… <span>◌</span>";

      host.innerHTML =
        '<div class="runner">' +
        stages
          .map(function (s) { return '<div class="run-line"><span class="run-dot"></span>' + esc(s) + "</div>"; })
          .join("") +
        '</div><div class="progress"><i></i></div>';
      var lines = $$(".run-line", host);
      var bar = $(".progress i", host);

      for (var i = 0; i < lines.length; i++) {
        lines[i].classList.add("is-run");
        bar.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
        await sleep(reduceMotion() ? 60 : 380);
        lines[i].classList.remove("is-run");
        lines[i].classList.add("is-done");
      }
      await sleep(reduceMotion() ? 40 : 200);

      var analysis = null;
      if (window.API && window.API.jdMatch) {
        try {
          var remote = await window.API.jdMatch(text);
          if (remote && remote.dims && remote.hitKeys) analysis = remote;
        } catch (err) {
          /* 后端未启动：回退本地关键词规则 */
        }
      }
      if (!analysis) analysis = enrichAnalysis(analyzeJD(text));
      renderMatchReport(analysis, host);
      run.removeAttribute("disabled");
      run.innerHTML = "重新分析 <span>↗</span>";
      running = false;
    });
  }

  /* ---------------- 实验室：Badcase 分析 ---------------- */
  function renderCallReport(call, host) {
    var sevClass = call.severity === "high" ? "sev--high" : call.severity === "mid" ? "sev--mid" : "sev--low";
    var html =
      '<div class="report">' +
      '<div class="report-head"><span class="badge">ATTRIBUTION DONE</span>' +
      "<div><h4>" + esc(call.title) + "</h4><small>" + esc(call.meta) + " · 模拟脱敏数据</small></div>" +
      '<span class="sev ' + sevClass + '" style="margin-left:auto">' + esc(call.severityLabel) + "</span></div>";

    html +=
      '<div class="report-block"><small>通话摘要</small><p style="font-size:14.5px;color:var(--text-2)">' + esc(call.summary) + "</p>" +
      '<div class="result-grid mt-24">' +
      '<div class="result-cell"><b>' + call.score + "</b><span>语音质量评分</span></div>" +
      '<div class="result-cell"><b>' + call.reasons.length + "</b><span>归因结论数</span></div>" +
      '<div class="result-cell"><b>' + call.risks.length + "</b><span>风险标签</span></div>" +
      "</div></div>";

    html +=
      '<div class="report-block"><small>风险标签</small><div class="tag-row">' +
      call.risks.map(function (r) { return '<span class="tag tag--orange">' + esc(r) + "</span>"; }).join("") +
      "</div></div>";

    html += '<div class="report-block"><small>失败原因归因</small><div class="point-list">';
    call.reasons.forEach(function (r, i) {
      html +=
        '<div class="point"><b>R' + (i + 1) + "</b><div><b>" + esc(r.t) + "</b><p>" + esc(r.d) + "</p></div></div>";
    });
    html += "</div></div>";

    html +=
      '<div class="report-block"><small>通话转写（关键片段已标注）</small><div class="transcript" style="max-height:none">' +
      call.turns
        .map(function (t) {
          return (
            '<div class="turn ' + (t.who === "agent" ? "is-agent" : "is-user") + (t.flag ? " is-flag" : "") + '">' +
            "<b>" + esc(t.label) + "</b><p>" + esc(t.text) + "</p></div>"
          );
        })
        .join("") +
      "</div></div>";

    html += '<div class="report-block"><small>改进建议（可直接进入需求池）</small><div class="point-list">';
    call.actions.forEach(function (a, i) {
      html += '<div class="point"><b>S' + (i + 1) + "</b><div><p>" + esc(a) + "</p></div></div>";
    });
    html += "</div></div>";

    html +=
      '<p class="muted" style="font-size:12px;font-family:var(--mono);letter-spacing:.06em;margin-top:22px">' +
      "NOTE · 通话内容为模拟脱敏数据，不代表任何真实客户信息。</p></div>";

    host.innerHTML = html;
  }

  function initLabBadcase() {
    var list = $("#callList");
    var host = $("#callOutput");
    if (!list || !host) return;

    list.innerHTML = (P.lab.calls || [])
      .map(function (c, i) {
        return (
          '<button class="call-item' + (i === 0 ? " is-active" : "") + '" data-idx="' + i + '">' +
          "<b>" + esc(c.index) + "</b><span>" + esc(c.title) + "<small>" + esc(c.meta) + "</small></span>" +
          '<span class="sev ' + (c.severity === "high" ? "sev--high" : c.severity === "mid" ? "sev--mid" : "sev--low") + '">' +
          esc(c.severity === "high" ? "HIGH" : c.severity === "mid" ? "MID" : "LOW") +
          "</span></button>"
        );
      })
      .join("");

    var running = false;
    async function pick(idx) {
      if (running) return;
      running = true;
      var call = P.lab.calls[idx];
      $$("button", list).forEach(function (b, i) {
        b.classList.toggle("is-active", i === idx);
      });

      host.innerHTML =
        '<div class="runner">' +
        ["读取通话转写", "识别失败模式", "归因风险标签", "生成改进建议"]
          .map(function (s) { return '<div class="run-line"><span class="run-dot"></span>' + esc(s) + "</div>"; })
          .join("") +
        '</div><div class="progress"><i></i></div>';
      var lines = $$(".run-line", host);
      var bar = $(".progress i", host);
      for (var i = 0; i < lines.length; i++) {
        lines[i].classList.add("is-run");
        bar.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
        await sleep(reduceMotion() ? 50 : 260);
        lines[i].classList.remove("is-run");
        lines[i].classList.add("is-done");
      }
      await sleep(reduceMotion() ? 30 : 160);
      renderCallReport(call, host);
      running = false;
    }

    $$("button", list).forEach(function (b) {
      b.addEventListener("click", function () { pick(parseInt(b.getAttribute("data-idx"), 10)); });
    });
    pick(0);
  }

  /* ---------------- 实验室：图纸识别流程 ---------------- */
  function initLabDrawing() {
    var run = $("#runDrawing");
    var host = $("#drawingOutput");
    var runLines = $("#drawingStages");
    var scan = $("#scanLine");
    var sheet = $("#sheet");
    if (!run || !host || !runLines) return;

    runLines.innerHTML = (P.lab.drawingStages || [])
      .map(function (s) {
        return (
          '<div class="stage-step" data-stage="' + esc(s.n) + '"><b>' + esc(s.t) + "<i>IDLE</i></b>" +
          "<small>" + esc(s.zh) + " · " + esc(s.d) + "</small></div>"
        );
      })
      .join("");

    function resetSheet() {
      if (!sheet) return;
      $$(".sheet-node", sheet).forEach(function (n) { n.classList.remove("is-hit"); });
      $$(".sheet-label", sheet).forEach(function (l) { l.classList.remove("is-on"); });
      if (scan) scan.classList.remove("is-on");
    }

    var running = false;
    run.addEventListener("click", async function () {
      if (running) return;
      running = true;
      run.setAttribute("disabled", "disabled");
      run.innerHTML = "识别中… <span>◌</span>";
      resetSheet();
      if (scan) scan.classList.add("is-on");

      host.innerHTML =
        '<div class="empty-state" style="min-height:200px"><b>◌</b><p>正在处理图纸…</p><small>PIPELINE RUNNING</small></div>';

      var steps = $$(".stage-step", runLines);
      var allLabels = [];
      for (var i = 0; i < steps.length; i++) {
        steps[i].classList.add("is-run");
        $("i", steps[i]).textContent = "RUNNING";
        if (i < 2) {
          // 预处理 / 定位阶段：不产生节点
        } else if (i === 2) {
          $$(".sheet-node", sheet).forEach(function (n, k) {
            setTimeout(function () { n.classList.add("is-hit"); }, k * 220);
          });
        }
        await sleep(reduceMotion() ? 80 : 900);
        steps[i].classList.remove("is-run");
        steps[i].classList.add("is-done");
        $("i", steps[i]).textContent = "DONE";
      }

      if (scan) scan.classList.remove("is-on");
      if (sheet) {
        $$(".sheet-label", sheet).forEach(function (l, k) {
          setTimeout(function () { l.classList.add("is-on"); }, k * 160);
        });
      }

      var rows = P.lab.drawingRows || [];
      var html =
        '<div class="report"><div class="report-head"><span class="badge">PIPELINE DONE</span>' +
        "<div><h4>结构化输出</h4><small>模拟数据 · 字段结构与运维系统对齐</small></div></div>" +
        '<div class="result-grid" style="margin-bottom:22px">' +
        '<div class="result-cell"><b>5</b><span>识别条目</span></div>' +
        '<div class="result-cell"><b>3</b><span>高置信度（≥0.94）</span></div>' +
        '<div class="result-cell"><b>2</b><span>待复核异常</span></div>' +
        "</div>" +
        '<div class="report-block"><small>管井 / 光缆段信息表</small><div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>编号</th><th>类型</th><th>位置 / 关系</th><th>置信度</th><th>状态</th></tr></thead><tbody>" +
        rows
          .map(function (r) {
            var st =
              r.status === "flag"
                ? '<span class="flag">待复核</span>'
                : '<span class="ok">正常</span>';
            return (
              "<tr><td class='mono'>" + esc(r.id) + "</td><td>" + esc(r.type) + "</td><td class='mono'>" + esc(r.pos) +
              "</td><td class='mono'>" + esc(r.conf) + "</td><td>" + st + "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div></div>" +
        '<div class="callout"><b>异常标注说明</b><p>C-208 与 J-016 的置信度低于 0.75 阈值，系统标记为待复核并给出原因：该区域图元与文字重叠、线宽低于样本均值，建议在人工校验工作台确认后回写知识库。</p></div>' +
        '<p class="muted" style="font-size:12px;font-family:var(--mono);letter-spacing:.06em;margin-top:22px">NOTE · 图纸与识别结果为模拟数据，用于演示流程，不代表真实项目产出。</p>' +
        "</div>";
      host.innerHTML = html;

      run.removeAttribute("disabled");
      run.innerHTML = "重新运行 <span>↗</span>";
      running = false;
    });
  }

  /* ---------------- 实验室：Tab ---------------- */
  function initLabTabs() {
    var tabs = $$(".lab-tab");
    if (!tabs.length) return;
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        var key = t.getAttribute("data-tab");
        tabs.forEach(function (x) { x.classList.toggle("is-active", x === t); });
        $$(".lab-panel").forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-panel") === key);
        });
      });
    });
  }

  /* ---------------- 博客：列表 ---------------- */
  function postCardHTML(p) {
    return (
      '<a class="post-card reveal" href="post.html?id=' + esc(p.id) + '">' +
      '<div class="post-meta"><b>' + esc(p.category) + "</b><span>" + esc(p.date) + "</span><span>" + esc(p.readTime) + "</span></div>" +
      "<h3>" + esc(p.title) + "</h3>" +
      "<p>" + esc(p.summary) + "</p>" +
      '<div class="tag-row">' +
      p.tags.slice(0, 3).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
      "</div>" +
      '<span class="work-link">阅读全文</span>' +
      "</a>"
    );
  }

  function featuredHTML(p) {
    return (
      '<a class="post-featured" href="post.html?id=' + esc(p.id) + '">' +
      '<div class="post-art post-art--' + esc(p.accent) + '">' +
      '<span class="pa-label">FEATURED / ' + esc(p.category) + "</span>" +
      '<span class="pa-glyph">' + esc(p.tags[0] || "NOTE") + "</span>" +
      '<span class="pa-label">' + esc(p.date) + " · " + esc(p.readTime) + "</span>" +
      "</div>" +
      '<div class="post-body">' +
      '<div class="post-meta"><b>编辑推荐</b><span>' + esc(p.category) + "</span></div>" +
      "<h3>" + esc(p.title) + "</h3>" +
      "<p>" + esc(p.summary) + "</p>" +
      '<div class="tag-row">' +
      p.tags.map(function (t) { return '<span class="tag tag--teal">' + esc(t) + "</span>"; }).join("") +
      "</div>" +
      '<span class="work-link">阅读全文</span>' +
      "</div></a>"
    );
  }

  function initBlog() {
    var grid = $("#postGrid");
    var feat = $("#featuredPost");
    if (!grid) return;

    var posts = P.posts || [];
    var cats = ["全部"];
    posts.forEach(function (p) { if (cats.indexOf(p.category) < 0) cats.push(p.category); });

    var featured = posts.filter(function (p) { return p.featured; })[0] || posts[0];
    if (feat) feat.innerHTML = featuredHTML(featured);

    function draw(cat) {
      var list = posts.filter(function (p) {
        return p.id !== featured.id && (cat === "全部" || p.category === cat);
      });
      grid.innerHTML = list.length
        ? list.map(postCardHTML).join("")
        : '<div class="empty-state" style="min-height:200px"><b>◌</b><p>该分类下暂无文章</p><small>EMPTY</small></div>';
    }

    var bar = $("[data-filter='posts']");
    if (bar) {
      bar.innerHTML = cats
        .map(function (c, i) {
          return '<button class="filter-btn' + (i === 0 ? " is-active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
        })
        .join("");
      $$("button", bar).forEach(function (b) {
        b.addEventListener("click", function () {
          $$("button", bar).forEach(function (x) { x.classList.toggle("is-active", x === b); });
          draw(b.getAttribute("data-cat"));
        });
      });
    }
    draw("全部");
  }

  /* ---------------- 博客：文章详情 ---------------- */
  function initPostDetail() {
    var body = $("[data-post-body]");
    if (!body) return;

    var id = new URLSearchParams(window.location.search).get("id");
    var posts = P.posts || [];
    var post = null;
    for (var i = 0; i < posts.length; i++) if (posts[i].id === id) post = posts[i];
    if (!post) post = posts[0];
    if (!post) return;

    document.title = post.title + " · 余俊曦 Product Lab";

    var crumb = $("[data-crumb]");
    if (crumb) crumb.textContent = post.title;

    var head = $("[data-post-head]");
    if (head) {
      head.innerHTML =
        '<span class="kicker">' + esc(post.category) + "</span>" +
        "<h1>" + esc(post.title) + "</h1>" +
        '<p class="sub">' + esc(post.subtitle) + "</p>" +
        '<div class="post-meta"><span>' + esc(P.profile.name) + "</span><span>" + esc(post.date) + "</span>" +
        "<span>阅读约 " + esc(post.readTime) + "</span></div>" +
        '<div class="tag-row mt-24">' +
        post.tags.map(function (t) { return '<span class="tag tag--teal">' + esc(t) + "</span>"; }).join("") +
        "</div>";
    }

    var html =
      '<p class="article-lede">' + esc(post.summary) + "</p>" +
      post.body
        .map(function (sec, idx) {
          return (
            '<section id="sec-' + (idx + 1) + '">' +
            "<h2>" + esc(sec.h) + "</h2>" +
            (sec.p || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
            (sec.list && sec.list.length
              ? "<ul>" + sec.list.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>"
              : "") +
            "</section>"
          );
        })
        .join("") +
      '<div class="callout"><b>关于这篇文章</b><p>' +
      "文中内容来自本人在真实项目中的复盘整理，涉及的企业数据均已脱敏。" +
      "观点仅代表个人实践，欢迎在邮件里提出不同意见。</p></div>";
    body.innerHTML = html;

    var side = $("[data-post-side]");
    if (side) {
      var others = [];
      for (var k = 1; k <= 3; k++) {
        var o = posts[(posts.indexOf(post) + k) % posts.length];
        if (o && o.id !== post.id) others.push(o);
      }
      side.innerHTML =
        '<div class="side-card"><h4>CONTENTS</h4><nav class="toc">' +
        post.body
          .map(function (sec, idx) {
            return '<a href="#sec-' + (idx + 1) + '">' + esc(sec.h) + "</a>";
          })
          .join("") +
        "</nav></div>" +
        '<div class="side-card"><h4>MORE POSTS</h4><div class="side-links">' +
        others
          .map(function (o) {
            return (
              '<a href="post.html?id=' + esc(o.id) + '">' + esc(o.title) + "<span>" + esc(o.date) + "</span></a>"
            );
          })
          .join("") +
        "</div></div>" +
        '<div class="side-card"><h4>RELATED WORK</h4><p style="font-size:13.5px;color:var(--text-3)">' +
        "本文涉及的项目案例可以先看：</p>" +
        '<a class="btn btn--ghost btn--sm btn--block mt-24" href="projects.html">项目案例集 <span>↗</span></a></div>';
    }

    // 目录高亮
    var tocLinks = $$(".toc a");
    if (tocLinks.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            tocLinks.forEach(function (a) {
              a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id);
            });
          });
        },
        { rootMargin: "-15% 0px -70% 0px" }
      );
      $$(".article-body section").forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------------- 首页：文章推荐 ---------------- */
  function initBlogTeaser() {
    var host = $("[data-render='posts']");
    if (!host) return;
    host.innerHTML = (P.posts || []).slice(0, 3).map(postCardHTML).join("");
  }

  /* ---------------- 年份 ---------------- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---------------- 打印前准备 ----------------
     滚动动效会让未进入视口的区块保持隐藏，打印 / 导出 PDF 前必须全部展开。 */
  function initPrintPrepare() {
    function prepare() {
      $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      $$(".cap-bar i, .match-track i").forEach(function (el) {
        el.style.width = (el.getAttribute("data-level") || "100") + "%";
      });
    }
    window.addEventListener("beforeprint", prepare);
    if (window.matchMedia) {
      var mq = window.matchMedia("print");
      if (mq.addEventListener) mq.addEventListener("change", function (e) { if (e.matches) prepare(); });
    }
  }

  /* ---------------- 启动 ---------------- */
  async function boot() {
    // 前后端：优先从后端 /api/bootstrap 拉取内容数据；失败则用 data.js 的本地数据兜底。
    if (window.API && window.API.bootstrap) {
      try {
        var remote = await window.API.bootstrap();
        if (remote && remote.profile && remote.projects) {
          window.PORTFOLIO = remote;
          P = remote;
        }
      } catch (err) {
        /* 后端未启动（如直接双击打开 HTML）：保留 data.js 本地数据 */
      }
    }
    renderMetrics();
    renderCapabilities();
    renderWorkCards();
    renderMarquee();

    initNav();
    initConsole();
    initResumeWorkbench();
    initProjects();
    initProjectDetail();
    initLabTabs();
    initLabMatcher();
    initLabBadcase();
    initLabDrawing();
    initBlog();
    initPostDetail();
    initBlogTeaser();
    initYear();
    initPrintPrepare();

    initBars();
    initCounters();
    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
