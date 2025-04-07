const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatContainer = document.getElementById("chat-container");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const apiKey = "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"; // Replace with your key
let isTyping = true;

sendBtn.addEventListener("click", () => {
  const message = input.value.trim();
  if (!message) return;

  const userBubble = addMessage("user", message);
  input.value = "";
  scrollToBottom();

  const botBubble = addMessage("bot", "...");
  scrollToBottom();

  fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: message }]
    })
  })
    .then(res => res.json())
    .then(data => {
      botBubble.innerHTML = "";
      const reply = data.choices?.[0]?.message?.content || "No reply.";
      const formatted = formatCode(reply);
      typeText(botBubble, formatted, true);
    })
    .catch(err => {
      botBubble.textContent = "Error: Check API key or network.";
    });
});

clearBtn.addEventListener("click", () => {
  chatContainer.innerHTML = "";
});

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  document.getElementById("prism-theme").disabled = isDark;
  document.getElementById("prism-dark").disabled = !isDark;
  themeToggle.textContent = isDark ? "☀️" : "🌙";
});

document.body.insertAdjacentHTML("beforeend", `
  <button id="typing-toggle" class="floating-btn">⏸️ Stop Typing</button>
`);
const typingToggle = document.getElementById("typing-toggle");
typingToggle.addEventListener("click", () => {
  isTyping = !isTyping;
  typingToggle.textContent = isTyping ? "⏸️ Stop Typing" : "▶️ Resume Typing";
});

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerHTML = `<div class="bubble">${text}</div>`;
  chatContainer.appendChild(msg);
  return msg.querySelector(".bubble");
}

function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth"
  });
}

function typeText(element, html, isHTML = false, speed = 20) {
  let i = 0;
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  element.innerHTML = "";
  element.appendChild(cursor);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const fullText = isHTML ? tempDiv.innerHTML : html;

  function type() {
    if (!isTyping) {
      setTimeout(type, 300);
      return;
    }
    if (i < fullText.length) {
      cursor.insertAdjacentHTML("beforebegin", fullText[i++] || "");
      scrollToBottom();
      setTimeout(type, speed);
    } else {
      cursor.remove();
      element.innerHTML = fullText;
      highlightCode(element);
      addCopyButton(element);
    }
  }

  type();
}

function formatCode(text) {
  return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang = "", code) => {
    const cleanLang = lang.toLowerCase() || "javascript";
    return `<pre><code class="language-${cleanLang}">${escapeHtml(code)}</code></pre>`;
  });
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(container) {
  const blocks = container.querySelectorAll("pre code");
  blocks.forEach(block => Prism.highlightElement(block));
}

function addCopyButton(container) {
  const blocks = container.querySelectorAll("pre");
  blocks.forEach(pre => {
    if (pre.querySelector(".copy-btn")) return;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.innerText);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 2000);
    };
    pre.appendChild(btn);
  });
}