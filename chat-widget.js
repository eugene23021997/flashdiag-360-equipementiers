/* =====================================================
   Flash Diag 360 — Assistant conversationnel (widget)
   Injecte une bulle de chat branchée sur l'API Claude.
   ===================================================== */
(function () {
  "use strict";

  var API_BASE =
    window.FLASHDIAG_CHAT_API ||
    "https://flashdiag-chat-api.jollytree-11571a1c.francecentral.azurecontainerapps.io";

  var SUGGESTIONS = [
    "En quoi consiste Flash Diag 360 ?",
    "Quels résultats concrets chez vos clients ?",
    "Comment l'IA est-elle utilisée ?",
    "Je veux échanger avec un expert",
  ];

  var WELCOME =
    "Bonjour 👋 Je suis l'assistant Flash Diag 360°. Diagnostic industriel en 5 semaines, " +
    "augmenté par l'IA : posez-moi vos questions, ou dites-moi ce qui vous amène !";

  /* ---------- Styles ---------- */
  var css = "\
#fdchat-btn{position:fixed;bottom:24px;right:24px;z-index:9998;width:60px;height:60px;border-radius:50%;\
background:linear-gradient(135deg,#FF4D52,#E03540);box-shadow:0 10px 30px rgba(255,77,82,.45);\
display:flex;align-items:center;justify-content:center;cursor:pointer;border:0;transition:transform .2s ease;}\
#fdchat-btn:hover{transform:scale(1.08);}\
#fdchat-btn svg{width:28px;height:28px;fill:#fff;}\
#fdchat-btn .fdchat-badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;\
background:#2ECC71;border:2px solid #fff;}\
#fdchat-panel{position:fixed;bottom:100px;right:24px;z-index:9999;width:380px;max-width:calc(100vw - 32px);\
height:560px;max-height:calc(100vh - 130px);background:#fff;border-radius:22px;overflow:hidden;\
box-shadow:0 30px 80px rgba(14,14,18,.28);display:none;flex-direction:column;\
font-family:'Aptos','Aptos Display',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}\
#fdchat-panel.fdchat-open{display:flex;animation:fdchat-in .25s ease;}\
@keyframes fdchat-in{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}\
.fdchat-head{background:#0E0E12;color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px;}\
.fdchat-head__logo{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#FF4D52,#E03540);\
display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#fff;flex:none;}\
.fdchat-head__t{flex:1;min-width:0;}\
.fdchat-head__t b{display:block;font-size:15px;letter-spacing:-.01em;}\
.fdchat-head__t span{display:flex;align-items:center;gap:6px;font-size:12px;color:#C8C8CE;}\
.fdchat-head__t span i{width:7px;height:7px;border-radius:50%;background:#2ECC71;display:inline-block;}\
.fdchat-close{background:none;border:0;color:#C8C8CE;font-size:22px;cursor:pointer;line-height:1;padding:4px;}\
.fdchat-close:hover{color:#fff;}\
.fdchat-body{flex:1;overflow-y:auto;padding:16px;background:#FAFAFB;display:flex;flex-direction:column;gap:10px;}\
.fdchat-msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;\
white-space:pre-wrap;word-wrap:break-word;}\
.fdchat-msg--bot{background:#fff;border:1px solid #EDEDF0;color:#0E0E12;align-self:flex-start;\
border-bottom-left-radius:6px;box-shadow:0 2px 8px rgba(14,14,18,.05);}\
.fdchat-msg--user{background:linear-gradient(135deg,#FF4D52,#E03540);color:#fff;align-self:flex-end;\
border-bottom-right-radius:6px;}\
.fdchat-msg b,.fdchat-msg strong{font-weight:700;}\
.fdchat-typing{display:inline-flex;gap:4px;padding:14px;align-self:flex-start;}\
.fdchat-typing i{width:7px;height:7px;border-radius:50%;background:#C8C8CE;animation:fdchat-b 1.2s infinite;}\
.fdchat-typing i:nth-child(2){animation-delay:.15s;}.fdchat-typing i:nth-child(3){animation-delay:.3s;}\
@keyframes fdchat-b{0%,60%,100%{transform:none;opacity:.4;}30%{transform:translateY(-5px);opacity:1;}}\
.fdchat-sugg{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px;}\
.fdchat-sugg button{border:1px solid #FF4D52;color:#E03540;background:#fff;border-radius:999px;\
padding:7px 13px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s ease;font-family:inherit;}\
.fdchat-sugg button:hover{background:#FFE3E4;}\
.fdchat-mailok{align-self:center;background:#E8F8EF;color:#1E7A45;border:1px solid #BCE9CF;border-radius:999px;\
padding:6px 14px;font-size:12.5px;font-weight:600;}\
.fdchat-foot{padding:12px;background:#fff;border-top:1px solid #EDEDF0;display:flex;gap:8px;align-items:flex-end;}\
.fdchat-input{flex:1;border:1px solid #DcDCE2;border-radius:14px;padding:10px 14px;font-size:14px;\
font-family:inherit;resize:none;max-height:110px;outline:none;line-height:1.4;color:#0E0E12;background:#FAFAFB;}\
.fdchat-input:focus{border-color:#FF4D52;background:#fff;}\
.fdchat-send{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#FF4D52,#E03540);\
border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;transition:transform .15s;}\
.fdchat-send:hover{transform:scale(1.06);}\
.fdchat-send:disabled{opacity:.45;cursor:default;transform:none;}\
.fdchat-send svg{width:18px;height:18px;fill:#fff;}\
.fdchat-note{text-align:center;font-size:10.5px;color:#7A7A85;padding:0 12px 8px;background:#fff;}\
@media (max-width:480px){#fdchat-panel{right:16px;bottom:90px;}#fdchat-btn{bottom:16px;right:16px;}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- DOM ---------- */
  var btn = document.createElement("button");
  btn.id = "fdchat-btn";
  btn.setAttribute("aria-label", "Ouvrir l'assistant Flash Diag");
  btn.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.7 1.4 5.1 3.6 6.7-.1.9-.5 2.3-1.5 3.6 0 0 2.5-.3 4.5-1.7 1.1.3 2.2.5 3.4.5 5.5 0 10-3.9 10-8.7S17.5 3 12 3z"/></svg>' +
    '<span class="fdchat-badge"></span>';

  var panel = document.createElement("div");
  panel.id = "fdchat-panel";
  panel.innerHTML =
    '<div class="fdchat-head">' +
    '<div class="fdchat-head__logo">FD</div>' +
    '<div class="fdchat-head__t"><b>Assistant Flash Diag 360°</b>' +
    "<span><i></i>En ligne · propulsé par l'IA</span></div>" +
    '<button class="fdchat-close" aria-label="Fermer">×</button></div>' +
    '<div class="fdchat-body" id="fdchat-body"></div>' +
    '<div class="fdchat-foot">' +
    '<textarea class="fdchat-input" id="fdchat-input" rows="1" placeholder="Votre question…"></textarea>' +
    '<button class="fdchat-send" id="fdchat-send" aria-label="Envoyer">' +
    '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg></button></div>' +
    '<div class="fdchat-note">Assistant IA — les informations importantes sont à confirmer avec nos équipes.</div>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var body = panel.querySelector("#fdchat-body");
  var input = panel.querySelector("#fdchat-input");
  var sendBtn = panel.querySelector("#fdchat-send");

  var history = []; // {role, content}
  var busy = false;
  var started = false;

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function render(s) {
    // gras **texte** uniquement, le reste reste du texte brut
    return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  }
  function addMsg(role, text) {
    var div = document.createElement("div");
    div.className = "fdchat-msg fdchat-msg--" + (role === "user" ? "user" : "bot");
    div.innerHTML = render(text);
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }
  function showWelcome() {
    if (started) return;
    started = true;
    addMsg("assistant", WELCOME);
    var sugg = document.createElement("div");
    sugg.className = "fdchat-sugg";
    SUGGESTIONS.forEach(function (q) {
      var b = document.createElement("button");
      b.textContent = q;
      b.onclick = function () {
        sugg.remove();
        sendMessage(q);
      };
      sugg.appendChild(b);
    });
    body.appendChild(sugg);
  }

  function toggle(open) {
    var isOpen = panel.classList.contains("fdchat-open");
    var next = open === undefined ? !isOpen : open;
    panel.classList.toggle("fdchat-open", next);
    if (next) {
      showWelcome();
      setTimeout(function () { input.focus(); }, 100);
    }
  }
  btn.onclick = function () { toggle(); };
  panel.querySelector(".fdchat-close").onclick = function () { toggle(false); };

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });
  sendBtn.onclick = function () { sendMessage(); };

  function sendMessage(forced) {
    var text = (forced !== undefined ? forced : input.value).trim();
    if (!text || busy) return;
    if (forced === undefined) {
      input.value = "";
      input.style.height = "auto";
    }
    var old = body.querySelector(".fdchat-sugg");
    if (old) old.remove();

    busy = true;
    sendBtn.disabled = true;
    addMsg("user", text);
    history.push({ role: "user", content: text });

    var typing = document.createElement("div");
    typing.className = "fdchat-typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;

    var botDiv = null;
    var botText = "";

    fetch(API_BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    })
      .then(function (resp) {
        if (!resp.ok || !resp.body) throw new Error("HTTP " + resp.status);
        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";

        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return;
            buffer += decoder.decode(r.value, { stream: true });
            var parts = buffer.split("\n\n");
            buffer = parts.pop();
            parts.forEach(function (part) {
              var line = part.split("\n").find(function (l) { return l.indexOf("data: ") === 0; });
              if (!line) return;
              var evt;
              try { evt = JSON.parse(line.slice(6)); } catch (e) { return; }
              if (evt.type === "text") {
                if (!botDiv) {
                  typing.remove();
                  botDiv = addMsg("assistant", "");
                }
                botText += evt.text;
                botDiv.innerHTML = render(botText);
                body.scrollTop = body.scrollHeight;
              } else if (evt.type === "error") {
                if (!botDiv) { typing.remove(); botDiv = addMsg("assistant", ""); }
                botText += (botText ? "\n\n" : "") + "⚠️ " + evt.message;
                botDiv.innerHTML = render(botText);
              }
            });
            return pump();
          });
        }
        return pump();
      })
      .catch(function () {
        typing.remove();
        if (!botDiv) {
          addMsg(
            "assistant",
            "Désolé, je rencontre un souci technique. Vous pouvez écrire directement à eugene.couybes@bearingpoint.com 🙂"
          );
        }
      })
      .then(function () {
        typing.remove();
        if (botText) history.push({ role: "assistant", content: botText });
        busy = false;
        sendBtn.disabled = false;
      });
  }
})();
