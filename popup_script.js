const generateInput = $("#generatePrompt");

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

  var incluedZone = $('#inclued');
  incluedZone.on('dragover', handleDragOver);
  incluedZone.on('drop', handleEvent);
  incluedZone.click(function () {
    const input = $('<input type="file" style="display:none;">');
    $('body').append(input);
    input.click();
    input.on('change', handleEvent);
  });

  $("input[name='UIType']").on('change', onChengeUIType);
  $("#saveButton").on('click', archivesPrompt);
  $("#popup-image").on('click', closePopup);
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
  $("#searchButton").on('click', () => {
    resetPromptList("#promptList");
    Search($("#search").val());
  });

  elmSearch.on('keypress', (e) => {
    const keyCodeReturn = 13;
    if (e.keyCode === keyCodeReturn) {
      resetPromptList("#promptList");
      Search($("#search").val());
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

function createOpenImageButton() {
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "s";
  button.onclick = () => {
    const imageUrl = "https://ul.h3z.jp/6hyEho3B.jpg";
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const arrayBuffer = reader.result;
          var binary = atob(arrayBuffer.split(',')[1]);
          $('#popup-image').attr({
            src: "data:image/png;base64," +binary,
            width: '256',
            height: '256'
          });
          $('#popup').show();
        };
      });
  };
  return button;
}

function Base64Png(file) {
  var reader = new FileReader();
  reader.onload = function(event) {
    var arrayBuffer = event.target.result;// base64テキスト
    var binary = atob(arrayBuffer.split(',')[1]);
    var url = "data:image/png;base64," +binary;
    createPngPreview(url)
  };
  reader.readAsDataURL(file);
}


function closePopup() {
  console.log("閉じる")
  $('#popup').hide();
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
      // if(item.url){
      // デバッグ表示
      if(true){
        li.appendChild(createOpenImageButton());
      }
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

function handleDragOver(event) {
  event.stopPropagation();
  event.preventDefault();
  event.originalEvent.dataTransfer.dropEffect = 'copy';
}

function handleEvent(event) {
  event.stopPropagation();
  event.preventDefault();

  var file = null;
  if (event.type === 'drop') {
    file = event.originalEvent.dataTransfer.files[0];
  } else if (event.type === 'change') {
    file = event.target.files[0];
  }

  switch(file.type){
    case "application/json":
    case "text/plain":
      readDicFile(file);
      break;
    case "image/png":
      readPngFile(file);
      break;
    default:
      break;
  }
}

function readDicFile(file){
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

function readPngFile(file) {
  
  // FileReaderオブジェクトを作成する
  const reader = new FileReader();
  reader.onload = function(event) {
    const arrayBuffer = event.target.result;  
    let pngInfo = getPngInfo(arrayBuffer);
    let outPut = pngInfo.textChunks;
    outPut["width"] = pngInfo.width
    outPut["height"] = pngInfo.height
    createPngInfo(outPut);
    createPngPreview(URL.createObjectURL(file))
  };
  reader.readAsArrayBuffer(file);
}

function createPngPreview(file) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fixSize = 540;
    let width = img.width;
    let height = img.height;

    if (width >= height && width > fixSize) {
      height *= fixSize / width;
      width = fixSize;
    } else if (height >= width && height > fixSize) {
      width *= fixSize / height;
      height = fixSize;
    }

    canvas.width = fixSize;
    canvas.height = height;

    // 画像を描画する
    const x = (canvas.width - width) / 2; // 左右中央揃えのためのx座標
    ctx.drawImage(img, x, 0, width, height);

    $('#preview').attr('src', canvas.toDataURL());
  };
  img.src = file;
}

function getPngInfo(arrayBuffer){
  let info = {};
  const dataView = new DataView(arrayBuffer);
  info.width = dataView.getUint32(16, false);
  info.height = dataView.getUint32(20, false);
  info.bitDepth = dataView.getUint8(24);
  info.colorType = dataView.getUint8(25);
  info.compressionMethod = dataView.getUint8(26);
  info.filterMethod = dataView.getUint8(27);
  info.interlaceMethod = dataView.getUint8(28);
  info.textChunks = getTextChunk(arrayBuffer);
  return info;
}

function getTextChunk(arrayBuffer){
  let data = {};
  let metadata = {};
  // tEXtチャンクを検索する
  let chunkOffset = 33; // 最初のIDATチャンクの直後から探索を開始する
  while (chunkOffset < arrayBuffer.byteLength) {
    const chunkLength = new DataView(arrayBuffer, chunkOffset, 4).getUint32(0, false);
    const chunkType = new TextDecoder().decode(new Uint8Array(arrayBuffer, chunkOffset + 4, 4));
    if (chunkType === 'tEXt') {
      // tEXtチャンクを発見した場合は、キーワードとテキストデータを抽出する
      let keywordEnd = new Uint8Array(arrayBuffer, chunkOffset + 8).indexOf(0);
      const keywordArray = new Uint8Array(arrayBuffer, chunkOffset + 8, keywordEnd);
      const keyword = new TextDecoder().decode(keywordArray);
      const textDataArray = new Uint8Array(arrayBuffer, chunkOffset + 8 + keywordEnd + 1, chunkLength - (keywordEnd + 1));
      const textData = new TextDecoder().decode(textDataArray);
      if(keyword === "Comment"){
        metadata = textData
        data = JSON.parse(metadata);
        data.metadata = metadata;
      }else if(keyword ==="parameters"){
        metadata = `prompt: ${textData}`
        data = parseSDPng(metadata);
        data.metadata = metadata;
      }
    }
    chunkOffset += chunkLength + 12; // 次のチャンクに移動する
  }
  ;
  return data;
}

function createPngInfo(data){
      // DOM操作で要素を生成する
      const div = $('<div>').addClass('item');
      $.each(data, function(key, value) {
        const label = $('<label>').text(key + ': ').css({ // スタイルを追加
          display: 'inline-block',
          width: '200px', // 変数名の表示幅を指定
          margin: '5px 10px 5px 0' // 各要素のマージンを指定
        });
        const element = $('<input>').attr({
          type: 'text',
          value: value,
          readonly: true // readonly属性を追加
        }).css({ // スタイルを追加
          display: 'inline-block',
          width: '200px' // 入力フィールドの幅を指定
        });
        div.append(label, element, '<br>'); // <br>要素は不要になる
      });
      
      // 要素をDOMに挿入する
      $('#pngInfo').empty();
      $('#pngInfo').append(div);
}

function parseSDPng(text) {
  const data = {};
  let matches = text.match(/(.*)(steps:.*)/i);
  if (matches) {
    matches = [...matches[0].matchAll(/([A-Za-z\s]+):\s*([^,\n]*)/g)];
    for (const match of matches) {
      const key = match[1].trim();
      const value = match[2].trim();

      if (key !== "prompt" && key !== "Negative prompt") {
        data[key] = value;
      }
    }
  }

  matches = [...text.matchAll(/([A-Za-z\s]+):\s*((?:[^,\n]+,)*[^,\n]+)/g)];
  for (const match of matches) {
    const key = match[1].trim();
    const value = match[2].trim();

    if (key === "prompt" || key === "Negative prompt") {
      data[key] = value;
    }
  }

  return data;
}

// function uploadPng(file){
//   // XMLHttpRequestオブジェクトを作成する
// const xhr = new XMLHttpRequest();

// // フォームデータを作成する
// const formData = new FormData();
// formData.append('files', file);

// // APIにリクエストを送信する
// xhr.open('POST', 'https://hm-nrm.h3z.jp/uploader/work.php');
// xhr.setRequestHeader('Accept', 'application/json');
// xhr.onload = function() {
//   if (xhr.status === 200) {
//     const response = JSON.parse(xhr.responseText);
//     console.log(response);
//   } else {
//     console.error('Request failed. Status code: ' + xhr.status);
//   }
// };
// xhr.send(formData);
// }