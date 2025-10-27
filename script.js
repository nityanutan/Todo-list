const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const voiceBtn = document.getElementById('voice-btn');
const list = document.getElementById('todo-list');

const saved = localStorage.getItem('todos');
const todos = saved ? JSON.parse(saved) : [];

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function showTempMessage(msg) {
  const originalPlaceholder = input.placeholder;
  input.placeholder = msg;
  setTimeout(() => {
    input.placeholder = originalPlaceholder;
  }, 3000);
}

const wordToNum = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

function normalizeTranscript(text) {
  let normalized = text.toLowerCase();
  for (const word in wordToNum) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    normalized = normalized.replace(regex, wordToNum[word]);
  }
  return normalized;
}

function processVoiceCommand(transcript) {
  const text = normalizeTranscript(transcript);
  let actionTaken = false;

  const commandRegex = /(delete|remove|mark|complete|unmark|uncheck)\s+(\d+)\s*(done|complete)?/;
  const match = text.match(commandRegex);

  if (match) {
    const action = match[1];
    const index = parseInt(match[2], 10) - 1;

    if (index >= 0 && index < todos.length) {
      if (action === 'delete' || action === 'remove') {
        todos.splice(index, 1);
        showTempMessage(`Item ${index + 1} removed!`);
        actionTaken = true;
      } else if (action === 'mark' || action === 'complete') {
        todos[index].completed = true;
        showTempMessage(`Item ${index + 1} marked as done!`);
        actionTaken = true;
      } else if (action === 'unmark' || action === 'uncheck') {
        todos[index].completed = false;
        showTempMessage(`Item ${index + 1} unchecked.`);
        actionTaken = true;
      }
    } else {
      showTempMessage(`Sorry, item ${index + 1} not found.`);
      actionTaken = true;
    }
  }

  if (actionTaken) {
    render();
    saveTodos();
    return true;
  }

  return false;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    voiceBtn.innerHTML = '🔴';
    voiceBtn.classList.add('listening');
    input.placeholder = 'Speak a command or new task...';
  };

  recognition.onend = () => {
    voiceBtn.innerHTML = '🎙️';
    voiceBtn.classList.remove('listening');
    input.placeholder = 'Type a new task...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript.trim()) {
      const isCommand = processVoiceCommand(transcript);
      if (!isCommand) {
        input.value = transcript.trim();
        addTodo();
        showTempMessage(`New task added: "${transcript.trim()}"`);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    showTempMessage("Voice recognition failed. Check permissions.");
  };

  voiceBtn.addEventListener('click', () => {
    try {
      recognition.start();
    } catch (e) {
      if (e.name === 'InvalidStateError') recognition.stop();
    }
  });

} else {
  voiceBtn.style.display = 'none';
  console.warn('Speech recognition not supported in this browser.');
}

function createTodoNode(todo, index) {
  const li = document.createElement('li');

  const numSpan = document.createElement("span");
  numSpan.classList.add('item-number');
  numSpan.textContent = `${index + 1}.`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = !!todo.completed;
  checkbox.addEventListener("change", () => {
    todo.completed = checkbox.checked;
    saveTodos();
    render();
  });

  const textContentSpan = document.createElement("span");
  textContentSpan.classList.add('item-text');
  textContentSpan.textContent = todo.text;

  const textWrapperSpan = document.createElement("span");
  textWrapperSpan.appendChild(numSpan);
  textWrapperSpan.appendChild(textContentSpan);

  if (todo.completed) {
    textContentSpan.style.textDecoration = 'line-through';
    textContentSpan.style.color = '#b0b0b0';
  }

  textWrapperSpan.addEventListener("dblclick", () => {
    const newText = prompt(`Edit item ${index + 1}:`, todo.text);
    if (newText !== null && newText.trim() !== "") {
      todo.text = newText.trim();
      saveTodos();
      render();
    }
  });

  const delBtn = document.createElement('button');
  delBtn.textContent = "Delete";
  delBtn.addEventListener('click', () => {
    todos.splice(index, 1);
    render();
    saveTodos();
  });

  li.appendChild(checkbox);
  li.appendChild(textWrapperSpan);
  li.appendChild(delBtn);
  return li;
}

function render() {
  list.innerHTML = '';
  todos.forEach((todo, index) => {
    const node = createTodoNode(todo, index);
    list.appendChild(node);
  });
}

function addTodo() {
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text: text, completed: false });
  input.value = '';
  render();
  saveTodos();
}

addBtn.addEventListener("click", addTodo);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

render();
