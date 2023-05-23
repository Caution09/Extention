// 初期化
init()
function init(){
  loadOptionData()
  loadMessage()
  // イベントの登録
  const tabs = $('.tab');
  tabs.on('click', tabSwitch);
  tabs.eq(1).on('click', addInit);
  tabs.eq(2).on('click', archivesInit);
  tabs.eq(3).on('click', editInit);

  $("input[name='UIType']").on('change', onChengeUIType);  
  $("#saveButton").on('click', archivesPrompt);
  $("#resetButton").on('click', ()=>chrome.storage.local.clear());
  $("#localDicDownload").on('click', ()=>jsonDownload(localPromptList,"localDic"));
  $("#PromptDownload").on('click', ()=>jsonDownload(archivesList,"Prompts"));
  $("#copyButton").on('click', function() {
    navigator.clipboard.writeText($("#generatePrompt").val());
  });

  $("#clearButton").on('click', function() {
    $("#generatePrompt").val("");
    savePrompt();
  });
  
  $("#resist").on('click', () => {
    const big = $("#big").val();
    const middle = $("#middle").val();
    const small = $("#small").val();
    const prompt = $("#prompt").val();
    Regist(big,middle,small,prompt);
    addInit()
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
  updateEditTab()
  editInit()
  saveOptionData()
}

function getNAIPrompt(str,weight){
  const match = getSDTypeWight(str);
  if (match) {
    const prompt = match[1];
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

function getWeight(str) {
  const match = getSDTypeWight(str);
  if(match){
    return parseFloat(match[2])
  }else{
    const naiWeight = getNAIWeight(str)
    return parseFloat((1.05 ** naiWeight).toFixed(2));
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

function getSDTypeWight(str){
  return str.match(/\(([^:]+):([\d.]+)\)/);
}

// データ操作
let editPrompts = []
function UpdateGenaretePrompt(str){
  generatePrompt.value = str;  // value1
  editPrompts = str.split(',').map(item => item.trim().replace(/\s{2,}/g, ' ')).filter(item => item !== '');
  editPrompt.init(str)
}

function updateEditTab(){
  jsonLoop(editPrompts,function(item,index){
    let weight = 0
    let prompt = ""
    switch(optionData.shaping){
      case "SD":
        weight = getWeight(item);
        prompt = getSDPrompt(item,weight)
        break;
      case "NAI":
        weight = getNAIWeight(item);
        prompt = getNAIPrompt(item,weight)
        break;
      case "None":
        weight = 0;
        prompt = item;
        break;
      }
    editingPrompt(prompt,index)  
  })
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
  let tmp = {title : "",prompt : generatePrompt.value}
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
  data.style.backgroundColor = "black"; 
  data.style.color = "white"; 
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

function createMoveElementButton(index,title,value){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = title;
  button.onclick = () => {
    const temp = editPrompts[index]
    editPrompts[index] = editPrompts[index + value]
    editPrompts[index + value] = temp
    editInit()
  };
  return button;
}

function createRegistButton(big,middle,small,prompt){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "保存";
  button.onclick = () => {
    Regist(big,middle,small,prompt);
    addInit()
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
    UpdateGenaretePrompt(value.prompt)
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

function createRemovePromptButton(index){
  let button = document.createElement('button');
  button.type = "submit";
  button.innerHTML = "X";
  button.onclick = () => {
    const result = window.confirm("本当に削除しますか？");
    if (result) {
      editPrompts.splice(index,1)
      reGeneratePrompt()
      editInit()
    }
    
  };
  return button;
}

function resetPromptList(listId){
  let targetList = $(listId).get(0);
  targetList.innerHTML = ""; 
}

function createHeaders(listId,...headers) {
  let li = document.createElement('li');
  for (let i = 0; i < headers.length; i++) {
    li.appendChild(createHeaderData(headers[i]));
  }
  $(listId).get(0).appendChild(li);
}

let isSearch = false;
function createSearchList(json,listId){
  if(isSearch){
    return;
  }
const dataNum = Object.keys(json).length
  console.log(dataNum)
  if(dataNum == 0){
    isSearch = true
    let searchKeword = $("#search").val()
    console.log(searchKeword)
    translate(searchKeword,(prompt)=>{
      createHeaders(listId,"大項目","中項目","小項目","Prompt")
      const data = ["Google翻訳","仮設定",searchKeword]
      let li = document.createElement('li');
      li.appendChild(createInputData(data[0]));
      li.appendChild(createInputData(data[1]));
      li.appendChild(createInputData(data[2]));
      li.appendChild(createInputData(prompt));
      li.appendChild(createAddButton("+",prompt+" "));
      li.appendChild(createAddButton("+,",prompt+","));
      li.appendChild(createCopyButton(prompt));
      li.appendChild(createRegistButton(data[0],data[1],data[2],prompt));
      $(listId).get(0).appendChild(li);
      isSearch = false
      $("#isSearch").html("");
    })
  }else{
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
      $(listId).get(0).appendChild(li);
    })  
  }
}

function createAddList(json,listId){
  createHeaders(listId,"大項目","中項目","小項目","Prompt")
  jsonLoop(json,function(item,index){
    let li = document.createElement('li');
    li.appendChild(createInputData(item.data[0],index,(value,index)=>{
      localPromptList[index].data[0] = value
      saveLocalList()
    }));
    li.appendChild(createInputData(item.data[1],index,(value,index)=>{
      localPromptList[index].data[1] = value
      saveLocalList()
    }));
    li.appendChild(createInputData(item.data[2],index,(value,index)=>{
      localPromptList[index].data[2] = value
      saveLocalList()
    }));
    li.appendChild(createInputData(item.prompt,index,(value,index)=>{
      localPromptList[index].prompt = value
      saveLocalList()
    }));
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
  const isNovelAI = optionData.shaping == "NAI";
  const isShapingNone = optionData.shaping == "None";
  const dataNum = Object.keys(json).length
  createHeaders(listId,"Prompt","重み")
  jsonLoop(json,function(item,index){
    let li = document.createElement('li');
    let weight = 0
    let prompt = ""
    switch(optionData.shaping){
      case "SD":
        weight = getWeight(item);
        prompt = getSDPrompt(item,weight)
        break;
      case "NAI":
        weight = getNAIWeight(item);
        prompt = getNAIPrompt(item,weight)
        break;
      case "None":
        weight = 0;
        prompt = item;
        break;
    }
    editingPrompt(prompt,index)

    const promptInput = createInputData(prompt,index,(value,index)=>{editingPrompt(value,index)})
    const weightInput = createInputData(weight,index,(value,index)=>{
      let weight = value.replace(/[^-0-9.]/g, '');
      if(!weight){
        weight =  isNovelAI ? 0 : 1;
      }
      let prompt = ""
      switch(optionData.shaping){
        case "SD":
          prompt = getSDPrompt(item,weight)
          break;
        case "NAI":
          prompt = getNAIPrompt(item,weight)
          break;
        case "None":
          prompt = item;
          break;
      }

      weightInput.value = weight
      promptInput.value = prompt
      editingPrompt(prompt,index)
    })

    li.appendChild(promptInput);
    if(!isShapingNone){
      li.appendChild(weightInput);
    }
    if(index < dataNum -1){
      li.appendChild(createMoveElementButton(index,"↓",1));
    }
    if(index > 0){
      li.appendChild(createMoveElementButton(index,"↑",-1));
    }
    li.appendChild(createRemovePromptButton(index));
    $(listId).get(0).appendChild(li);
  })
  setColumnWidth(listId,1,"200px")
  setColumnWidth(listId,2,"30px")
}

function setColumnWidth(listId, inputIndex, width) {
  $(listId).find('li input:nth-of-type(' + inputIndex + ')').css('width', width);
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