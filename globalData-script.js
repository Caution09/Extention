const generatePrompt = document.getElementById("generate_prompt");

let localPromptList = []
let archivesList = []
let editPrompts = []
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
        generatePrompt.value = items.generatePrompt;  // value1
        editPrompts = items.generatePrompt.split(',').filter(item => item !== "");
        console.log(editPrompts)
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
        optionData = {isNovelAI : false}
      }
      const uiTypeButtons = document.getElementsByName("UIType");
      if(optionData.isNovelAI){
        uiTypeButtons[1].checked = true;
      }else{
        uiTypeButtons[0].checked = true;
      }
    });
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
