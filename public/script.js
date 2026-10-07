const chat =
  document.getElementById("chat");

const welcome =
  document.getElementById("welcome");

const form =
  document.getElementById("chatForm");

const input =
  document.getElementById("messageInput");

const sendButton =
  document.getElementById("sendButton");

const newChat =
  document.getElementById("newChat");

const newChatTop =
  document.getElementById("newChatTop");

const historyContainer =
  document.getElementById("history");

const clearHistory =
  document.getElementById("clearHistory");

const menuButton =
  document.getElementById("menuButton");

const sidebar =
  document.querySelector(".sidebar");


let chats = JSON.parse(
  localStorage.getItem(
    "ai_chat_history"
  ) || "[]"
);


let currentChatId = null;

let messages = [];


// ==============================
// UTILIDADES
// ==============================

function createId() {
  return Date.now().toString();
}


function saveChats() {

  localStorage.setItem(
    "ai_chat_history",
    JSON.stringify(chats)
  );

}


function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


function formatText(text) {

  let safe =
    escapeHTML(text);


  safe = safe.replace(
    /```([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  );


  safe = safe.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );


  safe = safe.replace(
    /\n/g,
    "<br>"
  );


  return safe;

}


// ==============================
// HISTORIAL
// ==============================

function renderHistory() {

  historyContainer.innerHTML = "";


  chats
    .slice()
    .reverse()
    .forEach(chatData => {

      const button =
        document.createElement("button");


      button.className =
        "history-item";


      if (
        chatData.id ===
        currentChatId
      ) {

        button.classList.add(
          "active"
        );

      }


      button.textContent =
        chatData.title ||
        "Nueva conversación";


      button.onclick = () => {

        loadChat(
          chatData.id
        );

      };


      historyContainer.appendChild(
        button
      );

    });

}


// ==============================
// NUEVO CHAT
// ==============================

function startNewChat() {

  currentChatId =
    createId();


  messages = [];


  chat.innerHTML = "";


  chat.appendChild(
    welcome
  );


  welcome.style.display =
    "block";


  input.value = "";


  input.focus();


  renderHistory();


  sidebar.classList.remove(
    "open"
  );

}


// ==============================
// CARGAR CHAT
// ==============================

function loadChat(id) {

  const selected =
    chats.find(
      chatData =>
        chatData.id === id
    );


  if (!selected) return;


  currentChatId =
    selected.id;


  messages =
    [...selected.messages];


  chat.innerHTML = "";


  messages.forEach(message => {

    addMessageToScreen(
      message.role,
      message.content
    );

  });


  renderHistory();


  sidebar.classList.remove(
    "open"
  );


  scrollBottom();

}


// ==============================
// MOSTRAR MENSAJE
// ==============================

function addMessageToScreen(
  role,
  content
) {

  const message =
    document.createElement("div");


  message.className =
    `message ${role}`;


  const avatar =
    role === "user"
      ? "👤"
      : "✦";


  message.innerHTML = `
    <div class="message-inner">

      <div class="avatar">
        ${avatar}
      </div>

      <div class="message-content">
        ${formatText(content)}
      </div>

    </div>
  `;


  chat.appendChild(
    message
  );


  return message;

}


// ==============================
// ANIMACIÓN
// ==============================

function addTyping() {

  const message =
    document.createElement("div");


  message.className =
    "message assistant";


  message.id =
    "typingMessage";


  message.innerHTML = `
    <div class="message-inner">

      <div class="avatar">
        ✦
      </div>

      <div class="message-content">

        <div class="typing">

          <span></span>
          <span></span>
          <span></span>

        </div>

      </div>

    </div>
  `;


  chat.appendChild(
    message
  );


  scrollBottom();

}


// ==============================
// GUARDAR CHAT
// ==============================

function saveCurrentChat() {

  let current =
    chats.find(
      chatData =>
        chatData.id ===
        currentChatId
    );


  if (!current) {

    current = {

      id: currentChatId,

      title:
        "Nueva conversación",

      messages: []

    };


    chats.push(
      current
    );

  }


  current.messages =
    [...messages];


  const firstUserMessage =
    messages.find(
      message =>
        message.role ===
        "user"
    );


  if (firstUserMessage) {

    current.title =
      firstUserMessage.content
        .replace(
          /\s+/g,
          " "
        )
        .trim()
        .slice(0, 35);


    if (
      firstUserMessage.content
        .length > 35
    ) {

      current.title += "...";

    }

  }


  saveChats();

  renderHistory();

}


// ==============================
// ENVIAR
// ==============================

async function sendMessage(text) {

  text =
    text.trim();


  if (!text) return;


  if (!currentChatId) {

    currentChatId =
      createId();

  }


  welcome.style.display =
    "none";


  messages.push({

    role: "user",

    content: text

  });


  addMessageToScreen(
    "user",
    text
  );


  input.value = "";

  autoResize();


  sendButton.disabled =
    true;


  addTyping();

  scrollBottom();


  try {

    const response =
      await fetch(
        "/api/chat",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              messages
            })

        }
      );


    const data =
      await response.json();


    const typing =
      document.getElementById(
        "typingMessage"
      );


    if (typing) {

      typing.remove();

    }


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Error desconocido."
      );

    }


    const answer =
      data.response ||
      "No recibí una respuesta.";


    messages.push({

      role: "assistant",

      content: answer

    });


    addMessageToScreen(
      "assistant",
      answer
    );


    saveCurrentChat();


  } catch (error) {

    console.error(error);


    const typing =
      document.getElementById(
        "typingMessage"
      );


    if (typing) {

      typing.remove();

    }


    const errorMessage =
      "No pude conectarme con Gemini. " +
      "Revisa la API key y la configuración de Render.";


    addMessageToScreen(
      "assistant",
      errorMessage
    );


    messages.push({

      role: "assistant",

      content: errorMessage

    });


    saveCurrentChat();

  } finally {

    sendButton.disabled =
      false;


    input.focus();


    scrollBottom();

  }

}


// ==============================
// FORMULARIO
// ==============================

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    sendMessage(
      input.value
    );

  }
);


// ==============================
// ENTER
// ==============================

input.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();


      form.requestSubmit();

    }

  }
);


// ==============================
// AUTO RESIZE
// ==============================

input.addEventListener(
  "input",
  autoResize
);


function autoResize() {

  input.style.height =
    "auto";


  input.style.height =
    Math.min(
      input.scrollHeight,
      180
    ) + "px";

}


// ==============================
// SCROLL
// ==============================

function scrollBottom() {

  setTimeout(() => {

    chat.scrollTo({

      top:
        chat.scrollHeight,

      behavior:
        "smooth"

    });

  }, 50);

}


// ==============================
// SUGERENCIAS
// ==============================

document
  .querySelectorAll(
    ".suggestion"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const text =
          button.textContent
            .replace(
              /^.{2}/,
              ""
            )
            .trim();


        input.value =
          text;


        autoResize();

        input.focus();

      }
    );

  });


// ==============================
// NUEVO CHAT
// ==============================

newChat.addEventListener(
  "click",
  startNewChat
);


newChatTop.addEventListener(
  "click",
  startNewChat
);


// ==============================
// BORRAR HISTORIAL
// ==============================

clearHistory.addEventListener(
  "click",
  () => {

    chats = [];


    saveChats();


    startNewChat();

  }
);


// ==============================
// MENU
// ==============================

menuButton.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "open"
    );

  }
);


// ==============================
// INICIO
// ==============================

if (chats.length > 0) {

  loadChat(
    chats[
      chats.length - 1
    ].id
  );

} else {

  startNewChat();

}
