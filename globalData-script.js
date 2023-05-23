const generatePrompt = document.getElementById("generatePrompt");

let localPromptList = []
let archivesList = []
let masterPrompts = []
let optionData = {}

// データ保存
function savePrompt() {
  chrome.storage.local.set({'generatePrompt': generatePrompt.value});
}

function saveLocalList(){
  chrome.storage.local.set({'localPromptList': localPromptList});
}

function saveArchivesList() {
  chrome.storage.local.set({'archivesList': archivesList});
}

function saveOptionData() {
  chrome.storage.local.set({'optionData': optionData});

}function loadPrompt() {
chrome.storage.local.get(["generatePrompt"], function(items) {
  if(items.generatePrompt != null)
    UpdateGenaretePrompt(items.generatePrompt)
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
  const jsonString = JSON.stringify(json);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
  
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = fileName+'.json';
  link.click();
}

  //  DOM操作
  //  function sendBackground(execType,value){
  //   chrome.runtime.sendMessage({ args: [execType,value] }, function (response) {
  //     console.log(response.text); });
  // }
  
  // function insertPositivePronpt(value){
  //   sendBackground("Positive",value);
  // }
  
  // function insertNegativePronpt(value){
  //   sendBackground("Negative",value);
  // }
  
  // function GetPositive(){
  //   sendBackground("GetPositive",null);
  // }
  
  // function Generate(){
  //   sendBackground("Generate",null);
  // }
