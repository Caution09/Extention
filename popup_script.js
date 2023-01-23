const registAPI = "https://script.google.com/macros/s/AKfycbwsG9RUpvBo80seZTeyHq6Kyr-dN28ua56lUHMWZ0gYwrun72NHBzwjIMeFgKV3NgM0bA/exec";
const searchAPI = "https://script.google.com/macros/s/AKfycbzuf1Jlg0dAiQ4GyOBsxPFB_h58_4XOia8NcMhTTbQLx2KwIa9O3ft332qOTAd108kW/exec";

const elmBig = document.getElementById("big");
const elmMiddle = document.getElementById("middle");
const elmSmall = document.getElementById("small");
const elmPrompt = document.getElementById("prompt");
const elmResist = document.getElementById("resist");
const elmSearch = document.getElementById("search");
const elmPromptList = document.getElementById("promptList");
const elmSearchButton = document.getElementById("searchButton");
const elmisSearch = document.getElementById("isSearch");
const generateButton = document.getElementById("generateButton");
const tabs = $('.tab');
const editTab = $("#editTab");
const generatePrompt = document.getElementById("generate_prompt");

init()

function init(){
  GetPositive()
  elmSearch.focus();
  for(let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', tabSwitch, false);
  }

  editTab.onclick = editInit;

  generateButton.onclick = () => {
    Generate();
  }
  
  elmResist.onclick = () => {
    Regist();
  }
  
  elmSearchButton.onclick = () => {
    Search();
  }
  
  elmSearch.addEventListener('keypress', (e)=>{
    const keyCodeReturn = 13
    if(e.keyCode === keyCodeReturn){
      Search();
    }
  });
}

function editInit(){
  // var prompts = generatePrompt.value.split('');
  // alert(prompts)

}

function tabSwitch(){
  document.getElementsByClassName('is-active')[0].classList.remove('is-active');
  this.classList.add('is-active');
  document.getElementsByClassName('is-show')[0].classList.remove('is-show');
  const arrayTabs = Array.prototype.slice.call(tabs);
  const index = arrayTabs.indexOf(this);
  document.getElementsByClassName('panel')[index].classList.add('is-show');
};
  
function sendBackground(execType,value){
  chrome.runtime.sendMessage({ args: [execType,value] }, function (response) {
    console.log(response.text); });
}

function insertPositivePronpt(value){
  sendBackground("Positive",value);
  generatePrompt.value +=  value;
}

function insertNegativePronpt(value){
  sendBackground("Negative",value);
}

function GetPositive(){
  sendBackground("GetPositive",null);
}

function Generate(){
  sendBackground("Generate",null);
}

function Regist(){
  let url = registAPI;
  url += "?big=" + encodeURI(elmBig.value);
  url += "&middle=" + encodeURI(elmMiddle.value);
  url += "&small=" + encodeURI(elmSmall.value);
  url += "&prompt=" + encodeURI(elmPrompt.value);
  
  fetch(url, {
    method: "Get",
    mode: "cors"
  })
}

let isSearch = false
function Search(){
  if(isSearch){
    return
  }

  function createSearchData(value){
    let data = document.createElement('input');
    data.type = "text";
    data.value = value;
    data.className = "promptData";
    return data;
  }
  function createPositiveButton(name,value){
    let button = document.createElement('button');
    button.type = "submit";
    button.innerHTML = name;
    button.onclick = () => {
      insertPositivePronpt(value);
    };
    return button;
  }
  function createNegativeButton(name,value){
    let button = document.createElement('button');
    button.type = "submit";
    button.innerHTML = name;
    button.onclick = () => {
      insertNegativePronpt(value);
    };
    return button;
  }
  
  let children = document.getElementsByClassName('listItem');
  let num = children.length;
  if (num > 0){
    for(let i = 0; i < num; i++){
      elmPromptList.removeChild(children[0]);
    }  
  } 

  isSearch=true;
  elmisSearch.innerHTML = "検索中";

  let url = searchAPI;
  url += "?search=" + encodeURI(elmSearch.value);
  fetch(url) 
    .then( response => response.json())
    .then( json => {  
      console.log(json);
      const num = Object.keys(json).length
      for(let i = 0; i < num; i++){
        let li = document.createElement('li');
        li.className ="listItem";

        li.appendChild(createSearchData(json[i].data[0]));
        li.appendChild(createSearchData(json[i].data[1]));
        li.appendChild(createSearchData(json[i].data[2]));
        li.appendChild(createSearchData(json[i].prompt));
        li.appendChild(createPositiveButton("+",json[i].prompt+" "));
        li.appendChild(createPositiveButton("+,",json[i].prompt+","));
        li.appendChild(createNegativeButton("-",json[i].prompt+" "));
        li.appendChild(createNegativeButton("-,",json[i].prompt+","));
        elmPromptList.appendChild(li);
      }
      isSearch=false;
      elmisSearch.innerHTML = "";
    }
  );
}
