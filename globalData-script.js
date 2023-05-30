const toolVersion = 1
let localPromptList = []
let archivesList = []
let masterPrompts = []
let optionData = {}

// データ保存
function savePrompt() {
  chrome.storage.local.set({'generatePrompt': editPrompt.prompt});
}

function saveLocalList(){
  chrome.storage.local.set({'localPromptList': localPromptList});
}

function saveArchivesList() {
  chrome.storage.local.set({'archivesList': archivesList},()=>{
    UpdatePromptList();
  });
}

function saveOptionData() {
  chrome.storage.local.set({'optionData': optionData});

}function loadPrompt() {
chrome.storage.local.get(["generatePrompt"], function(items) {
  if(items.generatePrompt != null)
  InitGenaretePrompt(items.generatePrompt)
  });
}

function loadLocalList(){
chrome.storage.local.get(["localPromptList"], function(items) {
  if(items.localPromptList != null)
    localPromptList = items.localPromptList;  // value1
});
}

function loadArchivesList() {
chrome.storage.local.get(["archivesList"], function(items) {
  if(items.archivesList != null)
  archivesList = items.archivesList;  // value1
});
}
function loadOptionData() {
chrome.storage.local.get(["optionData"], function(items) {
  if(items.optionData != null){
    optionData = items.optionData;  // value1
  }else{
    optionData = {
      shaping : "SD"
      ,isDeleteCheck : false
    }
  }
  const uiTypeButtons = $('[name="UIType"]');

  switch(optionData.shaping){
    case "SD":
      uiTypeButtons.eq(0).prop('checked', true);
      break;
    case "NAI":
      uiTypeButtons.eq(1).prop('checked', true);
      break;
    case "None":
      uiTypeButtons.eq(2).prop('checked', true);
      break;
    }
});
}

function addLocalList(){
  chrome.storage.local.set({'localPromptList': localPromptList});
}

function addArchivesList() {
  chrome.storage.local.set({'archivesList': archivesList});
}

function jsonDownload(json,fileName){
  let outJson = {}
  outJson.dicType = fileName;
  outJson.data = json;

  const jsonString = JSON.stringify(outJson);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
  
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = fileName+'.json';
  link.click();
}

function UpdatePromptList(){
  sendBackground("UpdatePromptList",null);
}

function sendBackground(execType,value){
  chrome.runtime.sendMessage({ args: [execType,value] }, function (response) {
    console.log(response.text); });
}