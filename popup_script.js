const generateInput = $("#generatePrompt");
const PNG = require('pngjs').PNG;

// 初期化
init()
function init() {
  loadOptionData()
  loadMessage()
  // イベントの登録
  const tabs = $('.tab');
  tabs.on('click', tabSwitch);
  tabs.eq(1).on('click', addInit);
  tabs.eq(2).on('click', archivesInit);
  tabs.eq(3).on('click', editInit);

  var incluedDicZone = $('#incluedDic');
  incluedDicZone.on('dragover', handleDragOver);
  incluedDicZone.on('drop', handleEvent);
  incluedDicZone.click(function () {
    const input = $('<input type="file" style="display:none;">');
    $('body').append(input);
    input.click();
    input.on('change', handleEvent);
  });

  var incluedImageZone = $('#incluedImage');
  incluedImageZone.on('dragover', handleDragOver);
  incluedImageZone.on('drop', handlePng);
  incluedImageZone.click(function () {
    const input = $('<input type="file" style="display:none;">');
    $('body').append(input);
    input.click();
    input.on('change', handlePng);
  });
  
  $("input[name='UIType']").on('change', onChengeUIType);
  $("#saveButton").on('click', archivesPrompt);
  $("#resetButton").on('click', () => chrome.storage.local.clear());
  $("#localDicDownload").on('click', () => jsonDownload(localPromptList, "Elements"));
  $("#PromptDownload").on('click', () => jsonDownload(archivesList, "Prompts"));
  $("#copyButton").on('click', function () {
    navigator.clipboard.writeText(generateInput.val());
  });

  $("#clearButton").on('click', function () {
    generateInput.val("");
    savePrompt();
  });

  $("#resist").on('click', () => {
    const big = $("#big").val();
    const middle = $("#middle").val();
    const small = $("#small").val();
    const prompt = $("#prompt").val();
    Regist(big, middle, small, prompt);
    addInit()
  });

  generateInput.on("input", function () {
    editPrompt.init(generateInput.val())
    if (currentTab == 3) {
      editInit()
    }
  });

  generateInput.on("change", function () {
    editPrompt.init(generateInput.val())
    if (currentTab == 3) {
      editInit()
    }
  });

  generateInput.on("paste", function () {
    editPrompt.init(generateInput.val())
    if (currentTab == 3) {
      editInit()
    }
  });

  const elmSearch = $("#search");
  elmSearch.focus();

  $("#searchButton").on('click', () => {
    resetPromptList("#promptList");
    Search(elmSearch.val());
  });

  elmSearch.on('keypress', (e) => {
    const keyCodeReturn = 13;
    if (e.keyCode === keyCodeReturn) {
      resetPromptList("#promptList");
      Search(elmSearch.val());
    }
  });

  // 読み込み
  loadPrompt()
  loadLocalList()
  loadArchivesList()
}

function onChengeUIType(event) {
  const selectedValue = event.target.value;
  optionData.shaping = selectedValue
  InitGenaretePrompt(generateInput.val())
  editInit()
  saveOptionData()
}

// データ操作
function InitGenaretePrompt(str) {
  editPrompt.init(str)
  generateInput.val(editPrompt.prompt);  // value1
}

function UpdateGenaretePrompt() {
  generateInput.val(editPrompt.prompt)
  savePrompt()
}

function editInit() {
  resetPromptList("#editList")
  createEditList(editPrompt.elements, "#editList")
}

function archivesInit() {
  resetPromptList("#archiveList")
  createArchiveList(archivesList, "#archiveList")
}

function addInit() {
  resetPromptList("#addPromptList")
  createAddList(localPromptList, "#addPromptList");
}

function archivesPrompt() {
  let tmp = { title: "", prompt: generateInput.val() }
  archivesList.push(tmp)
  saveArchivesList()
  archivesInit()
}

function createHeaderData(value) {
  let data = document.createElement('input');
  data.type = "text";
  data.value = value;
  data.readOnly = true;
  data.className = "promptData";
  data.style.backgroundColor = "black";
  data.style.color = "white";
  return data;
}

function createInputData(value, index, event) {
  let data = document.createElement('input');
  data.type = "text";
  data.value = value;
  data.className = "promptData";

  if (event) {
    data.oninput = () => event(data.value, index)
  }

  return data;
}

function createMoveElementButton(index, title, value) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = title;
  button.onclick = () => {
    editPrompt.moveElement(index, value)
    UpdateGenaretePrompt()
    editInit()
  };
  return button;
}

function createRegistButton(big, middle, small, prompt) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "保存";
  button.onclick = () => {
    Regist(big, middle, small, prompt);
    addInit()
  };
  return button;
}

function createAddButton(name, value) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = name;
  button.onclick = () => {
    generateInput.val(generateInput.val() + value);
    savePrompt();
  };
  return button;
}

function createCopyButton(value) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "Copy";
  button.onclick = () => {
    navigator.clipboard.writeText(value)
  };
  return button;
}

function createRemoveButton(index) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "X";
  button.onclick = () => {
    const result = window.confirm("本当に削除しますか？");
    if (result) {
      localPromptList.splice(index, 1)
      saveLocalList()
      addInit()
    }

  };
  return button;
}

function createLoadButton(value) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "Load";
  button.onclick = () => {
    editPrompt.init(value)
    UpdateGenaretePrompt()
    savePrompt()
  };
  return button;
}

function createDeleteButton(index) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "X";
  button.onclick = () => {
    const result = window.confirm("本当に削除しますか？");
    if (result) {
      archivesList.splice(index, 1)
      saveArchivesList()
      archivesInit()
    }
  };
  return button;
}

function createRemovePromptButton(index) {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "X";
  button.onclick = () => {
    const result = window.confirm("本当に削除しますか？");
    if (result) {
      editPrompt.removeElement(index)
      UpdateGenaretePrompt()
      editInit()
    }
  };
  return button;
}

function resetPromptList(listId) {
  let targetList = $(listId).get(0);
  targetList.innerHTML = "";
}

function createHeaders(listId, ...headers) {
  let li = document.createElement('li');
  for (let i = 0; i < headers.length; i++) {
    li.appendChild(createHeaderData(headers[i]));
  }
  $(listId).get(0).appendChild(li);
}

let isSearch = false;
function createSearchList(json, listId) {
  if (isSearch) {
    return;
  }
  const dataNum = Object.keys(json).length
  if (dataNum == 0) {
    isSearch = true
    let searchKeword = $("#search").val()
    console.log(searchKeword)
    translate(searchKeword, (prompt) => {
      createHeaders(listId, "大項目", "中項目", "小項目", "Prompt")
      const data = ["Google翻訳", "仮設定", searchKeword]
      let li = document.createElement('li');
      li.appendChild(createInputData(data[0]));
      li.appendChild(createInputData(data[1]));
      li.appendChild(createInputData(data[2]));
      li.appendChild(createInputData(prompt));
      li.appendChild(createAddButton("+", prompt + " "));
      li.appendChild(createAddButton("+,", prompt + ","));
      li.appendChild(createCopyButton(prompt));
      li.appendChild(createRegistButton(data[0], data[1], data[2], prompt));
      $(listId).get(0).appendChild(li);
      isSearch = false
      $("#isSearch").html("");
    })
  } else {
    createHeaders(listId, "大項目", "中項目", "小項目", "Prompt")
    jsonLoop(json, function (item, index) {
      let li = document.createElement('li');
      li.appendChild(createInputData(item.data[0]));
      li.appendChild(createInputData(item.data[1]));
      li.appendChild(createInputData(item.data[2]));
      li.appendChild(createInputData(item.prompt));
      li.appendChild(createAddButton("+", item.prompt + " "));
      li.appendChild(createAddButton("+,", item.prompt + ","));
      li.appendChild(createCopyButton(item.prompt));
      $(listId).get(0).appendChild(li);
    })
  }
}

function createAddList(json, listId) {
  createHeaders(listId, "大項目", "中項目", "小項目", "Prompt")
  jsonLoop(json, function (item, index) {
    let li = document.createElement('li');
    li.appendChild(createInputData(item.data[0], index, (value, index) => {
      localPromptList[index].data[0] = value
      saveLocalList()
    }));
    li.appendChild(createInputData(item.data[1], index, (value, index) => {
      localPromptList[index].data[1] = value
      saveLocalList()
    }));
    li.appendChild(createInputData(item.data[2], index, (value, index) => {
      localPromptList[index].data[2] = value
      saveLocalList()
    }));
    li.appendChild(createInputData(item.prompt, index, (value, index) => {
      localPromptList[index].prompt = value
      saveLocalList()
    }));
    li.appendChild(createAddButton("+", item.prompt + " "));
    li.appendChild(createAddButton("+,", item.prompt + ","));
    li.appendChild(createCopyButton(item.prompt));
    li.appendChild(createRemoveButton(index));
    $(listId).get(0).appendChild(li);
  })
}

function createArchiveList(json, listId) {
  createHeaders(listId, "名前", "Prompt")
  jsonLoop(json, function (item, index) {
    let li = document.createElement('li');
    li.appendChild(createInputData(item.title, index, (value, index) => {
      archivesList[index].title = value
      saveArchivesList()
    }));
    li.appendChild(createInputData(item.prompt, index, (value, index) => {
      archivesList[index].prompt = value
      saveArchivesList()
    }));
    li.appendChild(createCopyButton(item.prompt));
    li.appendChild(createLoadButton(item.prompt));
    li.appendChild(createDeleteButton(index));

    $(listId).get(0).appendChild(li);
  })
  setColumnWidth(listId, 1, "150px")
}

function createEditList(json, listId) {
  const dataNum = Object.keys(json).length
  createHeaders(listId, "Prompt", "重み")
  jsonLoop(json, function (item, index) {
    let li = document.createElement('li');
    let weight = item[optionData.shaping].weight
    let prompt = item[optionData.shaping].value

    let valueInput = createInputData(prompt, index, (value, index) => {
      editPrompt.editingValue(value, index)
      weightInput.value = editPrompt.elements[index][optionData.shaping].weight
      UpdateGenaretePrompt()
    })
    let weightInput = createInputData(weight, index, (value, index) => {
      let weight = value.replace(/[^-0-9.]/g, '');
      editPrompt.editingWeight(weight, index)
      valueInput.value = editPrompt.elements[index][optionData.shaping].value
      UpdateGenaretePrompt()
    })

    li.appendChild(valueInput);
    if (weight) {
      li.appendChild(weightInput);
    }
    if (index < dataNum - 1) {
      li.appendChild(createMoveElementButton(index, "↓", 1));
    }
    if (index > 0) {
      li.appendChild(createMoveElementButton(index, "↑", -1));
    }
    li.appendChild(createRemovePromptButton(index));
    $(listId).get(0).appendChild(li);
  })
  setColumnWidth(listId, 1, "200px")
  setColumnWidth(listId, 2, "30px")
}

function setColumnWidth(listId, inputIndex, width) {
  $(listId).find('li input:nth-of-type(' + inputIndex + ')').css('width', width);
}

function jsonLoop(json, callback) {
  if (!json) {
    return
  }
  const num = Object.keys(json).length
  for (let i = 0; i < num; i++) {
    callback(json[i], i)
  }
}

let currentTab = 0
function tabSwitch() {
  document.getElementsByClassName('is-active')[0].classList.remove('is-active');
  this.classList.add('is-active');
  document.getElementsByClassName('is-show')[0].classList.remove('is-show');
  const arrayTabs = Array.prototype.slice.call($('.tab'));
  currentTab = arrayTabs.indexOf(this);
  document.getElementsByClassName('panel')[currentTab].classList.add('is-show');
};

function handleEvent(event) {
  event.stopPropagation();
  event.preventDefault();

  var file = null;

  if (event.type === 'drop') {
    file = event.originalEvent.dataTransfer.files[0];
  } else if (event.type === 'change') {
    file = event.target.files[0];
  }

  var reader = new FileReader();

  reader.onload = function (event) {
    const content = JSON.parse(event.target.result); // 読み込んだファイルをJSON形式のデータとして解析する
    console.log(event.target.result); // 読み込んだJSONデータをコンソールに表示する
    switch(content.dicType){
      case "Elements":
        break;
      case "Prompts":
        break;
      default:
        break;
    }
    console.log(content); // 読み込んだJSONデータをコンソールに表示する
  };

  reader.readAsText(file);
}

function handleDragOver(event) {
  event.stopPropagation();
  event.preventDefault();
  event.originalEvent.dataTransfer.dropEffect = 'copy';
}

function handlePng(event) {
  event.preventDefault();

  // ドロップされたファイルを取得する
  var file = null;

  if (event.type === 'drop') {
    file = event.originalEvent.dataTransfer.files[0];
  } else if (event.type === 'change') {
    file = event.target.files[0];
  }

  // ファイルがPNGファイルかどうかを確認する
  if (file.type !== 'image/png') {
    console.error('This is not a PNG file.');
    return;
  }

  // FileReaderオブジェクトを作成する
  const reader = new FileReader();

  // PNGファイルを読み込む
  reader.onload = function(event) {
    const arrayBuffer = event.target.result;
    const png = new PNG({ filterType: 4 });
    png.parse(arrayBuffer, function(error, data) {
      if (error) {
        console.error(error);
        return;
      }
  
      // メタデータを取得する
      const width = this.width;
      const height = this.height;
      const bitDepth = this.bitDepth;
      const colorType = this.colorType;
      const palette = this.palette;
      const transparency = this.transparency;
      const textChunks = this.text;
  
      // 取得したメタデータを表示する
      console.log('Width:', width);
      console.log('Height:', height);
      console.log('Bit Depth:', bitDepth);
      console.log('Color Type:', colorType);
      console.log('Palette:', palette);
      console.log('Transparency:', transparency);
      console.log('Text Chunks:', textChunks);
    });
  };

  reader.readAsArrayBuffer(file);
}