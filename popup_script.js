const elmResist = document.getElementById("resist");
const elmSearch = document.getElementById("search");
const elmSearchButton = document.getElementById("searchButton");
const copyButton = document.getElementById("copyButton");
const clearButton = document.getElementById("clearButton");
const saveButton = document.getElementById("saveButton");

// chrome.storage.local.clear()
init()
// 初期化
function init(){
  loadOptionData()
  loadMessage()
  elmSearch.focus();

  // イベントの登録
  const tabs = $('.tab');
  for(let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', tabSwitch, false);
  }
  tabs[1].addEventListener('click', addInit, false);
  tabs[2].addEventListener('click', archivesInit, false);
  tabs[3].addEventListener('click', editInit, false);

  copyButton.onclick = () => {
    navigator.clipboard.writeText(generatePrompt.value)
  }

  clearButton.onclick = () => {
    generatePrompt.value = ""
    savePrompt()
  }

  saveButton.onclick = () => {
    archivesPrompt()
  }  
  
  elmResist.onclick = () => {
    const big = $("#big").val();
    const middle = $("#middle").val();
    const small = $("#small").val();
    const prompt = $("#prompt").val();
    Regist(big,middle,small,prompt);
  }
  
  elmSearchButton.onclick = () => {
    Search(elmSearch.value);
  }
  
  elmSearch.addEventListener('keypress', (e)=>{
    const keyCodeReturn = 13
    if(e.keyCode === keyCodeReturn){
      Search();
    }
  });

    const uiTypeButtons = document.getElementsByName("UIType");
    uiTypeButtons.forEach(function(item) {
    item.addEventListener("change", onChengeUIType);
  });
  
  // 読み込み
  loadPrompt()
  loadLocalList()
  loadArchivesList()
}

function onChengeUIType(event) {
  const selectedValue = event.target.value;
  if (selectedValue === "SD") {
    optionData.isNovelAI = false
  } else if (selectedValue === "NAI") {
    optionData.isNovelAI = true
  }
  updateEditTab()
  editInit()
  saveOptionData()
}

function updateEditTab(){
  jsonLoop(editPrompts,function(item,index){
    let weight = 0
    let prompt = ""
    if( optionData.isNovelAI){
      weight = getNAIWeight(item);
      prompt = getNAIPrompt(item,weight)
    }else{
      weight = getSDWeight(item);
      prompt = getSDPrompt(item,weight)
    }
    editingPrompt(prompt,index)  
  })
}

 function editInit(){
  resetPromptList("#editList")
  createEditList(editPrompts,"#editList")
}

function archivesInit(){
    resetPromptList("#archiveList")
    createArchiveList(archivesList,"#archiveList")
}

function addInit(){
  resetPromptList("#addPromptList")
  createAddList(localPromptList,"#addPromptList");  
}
  
function archivesPrompt(){
  let tmp = {
    title : "",
    prompt : generatePrompt.value
  }

  archivesList.push(tmp)
  saveArchivesList()
  archivesInit()
}

function createHeaderData(value){
  let data = document.createElement('input');
  data.type = "text";
  data.value = value;
  data.readOnly = true;
  data.className = "promptData";
  data.style.backgroundColor = "black"; // 背景色を黒く設定
  data.style.color = "white"; // 文字色を白く設定
  return data;
}

function createInputData(value,index,event){
  let data = document.createElement('input');
  data.type = "text";
  data.value = value;
  data.className = "promptData";

  if(event){
    data.oninput = ()=>event(data.value,index)
  }

  return data;
}

function createRegistButton(big,middle,small,prompt){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "New";
  button.onclick = () => {
    Regist(big,middle,small,prompt);
  };
  return button;
}

function createAddButton(name,value){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = name;
  button.onclick = () => {
    generatePrompt.value += value;
    savePrompt();
  };
  return button;
}

function createCopyButton(value){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "Copy";
  button.onclick = () => {
    navigator.clipboard.writeText(value)
  };
  return button;
}

function createRemoveButton(index){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "X";
  button.onclick = () => {
    const result = window.confirm("本当に削除しますか？");
    if (result) {
      localPromptList.splice(index,1)
      saveLocalList()
      addInit()
    }
    
  };
  return button;
}

function createLoadButton(value){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "Load";
  button.onclick = () => {
    generatePrompt.value = value.prompt
    editPrompts = value.prompt.split(',').filter(item => item !== "");
    savePrompt()
    updateEditTab()
    editInit()
    saveOptionData()
  };
  return button;
}

function createDeleteButton(index){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "X";
  button.onclick = () => {
    const result = window.confirm("本当に削除しますか？");
    if (result) {
      archivesList.splice(index,1)
      saveArchivesList()
      archivesInit()
    }
  };
  return button;
}

function resetPromptList(listId){
  let targetList = $(listId).get(0);
  targetList.innerHTML = ""; 
}

function createSearchList(json,listId){
  createHeaders(listId,"大項目","中項目","小項目","Prompt")
  jsonLoop(json,function(item,index){
    let li = document.createElement('li');
    li.appendChild(createInputData(item.data[0]));
    li.appendChild(createInputData(item.data[1]));
    li.appendChild(createInputData(item.data[2]));
    li.appendChild(createInputData(item.prompt));
    li.appendChild(createAddButton("+",item.prompt+" "));
    li.appendChild(createAddButton("+,",item.prompt+","));
    li.appendChild(createCopyButton(item.prompt));
    li.appendChild(createRegistButton(item.data[0],item.data[1],item.data[2],item.prompt));
    $(listId).get(0).appendChild(li);
  })
}

function createAddList(json,listId){
  createHeaders(listId,"大項目","中項目","小項目","Prompt")
  jsonLoop(json,function(item,index){
    let li = document.createElement('li');
    li.appendChild(createInputData(item.data[0]));
    li.appendChild(createInputData(item.data[1]));
    li.appendChild(createInputData(item.data[2]));
    li.appendChild(createInputData(item.prompt));
    li.appendChild(createAddButton("+",item.prompt+" "));
    li.appendChild(createAddButton("+,",item.prompt+","));
    li.appendChild(createCopyButton(item.prompt));
    li.appendChild(createRemoveButton(index));
    $(listId).get(0).appendChild(li);
  })
}

function createArchiveList(json,listId){
  createHeaders(listId,"名前","Prompt")
  jsonLoop(json,function(item,index){
    let li = document.createElement('li');
    li.appendChild(createInputData(item.title,index,(value,index)=>{
      archivesList[index].title = value
      saveArchivesList()
    }));
    li.appendChild(createInputData(item.prompt,index,(value,index)=>{
      archivesList[index].prompt = value
      saveArchivesList()
    }));
    li.appendChild(createCopyButton(item.prompt));
    li.appendChild(createLoadButton(item));
    li.appendChild(createDeleteButton(index));
    
    $(listId).get(0).appendChild(li);
  })
  setColumnWidth(listId,1,"150px")
}

function createEditList(json,listId){
  createHeaders(listId,"Prompt","重み")
  jsonLoop(json,function(item,index){
    if(item == "" || item ==  ''){
      return
    }
    let li = document.createElement('li');
    let weight = 0
    let prompt = ""
    if( optionData.isNovelAI){
      weight = getNAIWeight(item);
      prompt = getNAIPrompt(item,weight)
    }else{
      weight = getSDWeight(item);
      prompt = getSDPrompt(item,weight)
    }
    editingPrompt(prompt,index)

    const promptInput = createInputData(prompt,index,(value,index)=>{editingPrompt(value,index)})
    const weightInput = createInputData(weight,index,(value,index)=>{
      let weight = value.replace(/[^-0-9.]/g, '');
      if(!weight){
        weight =  optionData.isNovelAI ? 0 : 1;
      }
      let prompt = ""
      if( optionData.isNovelAI){
        prompt = getNAIPrompt(item,weight)
      }else{
        prompt = getSDPrompt(item,weight)
      }
      weightInput.value = weight
      promptInput.value = prompt
      editingPrompt(prompt,index)
    })

    li.appendChild(promptInput);
    li.appendChild(weightInput);

    $(listId).get(0).appendChild(li);
  })
  setColumnWidth(listId,1,"200px")
  setColumnWidth(listId,2,"30px")
}

function setColumnWidth(listId, inputIndex, width) {
  $(listId).find('li input:nth-of-type(' + inputIndex + ')').css('width', width);
}

function getNAIPrompt(str,weight){
  const match = getSDTypeWight(str);
  if (match) {
    const prompt = match[1];
    console.log(prompt)
    if(weight > 0){
      return `${"{".repeat(weight)}${prompt}${"}".repeat(weight)}`
    }else{
      weight *= -1
      return `${"(".repeat(weight)}${prompt}${")".repeat(weight)}`
    }
  }else{
    let prompt = str.replace(/[{}()]/g, "")
    if(weight > 0){
      return `${"{".repeat(weight)}${prompt}${"}".repeat(weight)}`
    }else{
      weight *= -1
      return `${"(".repeat(weight)}${prompt}${")".repeat(weight)}`
    }
  }
}

function getSDPrompt(str,weight){
  const match = getSDTypeWight(str);
  if (match) {
    return `(${match[1]}:${weight})`;
}else{
    if (weight !== 1) {
      str = str.replace(/[{}()]/g, "")
      return `(${str}:${weight})`;
    } else {
      return str;
    }
  }
}

function getNAIWeight(str){
  const match = getSDTypeWight(str);
  if(match){
    let SDWeight = parseFloat(match[2])
    return (Math.log(SDWeight) / Math.log(1.05)).toFixed(0);
  }else{
    let weight = str.split("{").length - 1
    if(weight == 0){
      weight = (str.split("(").length - 1) * -1
    }
    return weight
  }
}

function getSDWeight(str) {
  const match = getSDTypeWight(str);
  if(match){
    return parseFloat(match[2])
  }else{
    const naiWeight = getNAIWeight(str)
    return parseFloat((1.05 ** naiWeight).toFixed(2));
  }
}

function getSDTypeWight(str){
  return str.match(/\(([^:]+):([\d.]+)\)/);
}

function editingPrompt(value,index){
  editPrompts[index] = value
  reGeneratePrompt()
}

function reGeneratePrompt(){
  generatePrompt.value = ""
  editPrompts.forEach((value,index,array)=>{
    generatePrompt.value += value + ","
  })
  savePrompt()
}

function createHeaders(listId,...headers) {
  let li = document.createElement('li');
  for (let i = 0; i < headers.length; i++) {
    li.appendChild(createHeaderData(headers[i]));
  }
  $(listId).get(0).appendChild(li);
}

function jsonLoop(json,callback){
  if(!json){
    return
  }
  console.log(json);
  const num = Object.keys(json).length
  for(let i = 0; i < num; i++){
    callback(json[i],i)
  }
}

function tabSwitch(){
  document.getElementsByClassName('is-active')[0].classList.remove('is-active');
  this.classList.add('is-active');
  document.getElementsByClassName('is-show')[0].classList.remove('is-show');
  const arrayTabs = Array.prototype.slice.call($('.tab'));
  const index = arrayTabs.indexOf(this);
  document.getElementsByClassName('panel')[index].classList.add('is-show');
};
