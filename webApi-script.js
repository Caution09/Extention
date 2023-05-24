const searchAPI = "https://script.google.com/macros/s/AKfycbz2ev7z3ay_v8NwlTLX84obKIyCLltlHwY3DKEMsF8Po8dcrH_-GdKhWTT_WD4ze4vxxA/exec";
function Search(search){
  
    $("#isSearch").html("検索中");
    let url = searchAPI + "?search=" + encodeURI(search);
    console.log(search)

    json = []
    jsonLoop(localPromptList,function(item,index){
      let tmp = item.data[0] + item.data[1] + item.data[2] + item.prompt;
      let searchCheck = tmp.includes(search)
      if (searchCheck){
        json[Object.keys(json).length]=item
      }
    })
    jsonLoop(masterPrompts,function(item,index){
      let tmp = item.data[0] + item.data[1] + item.data[2] + item.prompt;
      let searchCheck = tmp.includes(search)
      if (searchCheck){
        json[Object.keys(json).length]=item
      }
    })

    const isHit = Object.keys(json).length > 0
    createSearchList(json,"#promptList");
    if(isHit){
     $("#isSearch").html("");
    }
    fetch(url, {method: "Get",mode: "cors"})
  }
  
  const registAPI = "https://script.google.com/macros/s/AKfycbwsG9RUpvBo80seZTeyHq6Kyr-dN28ua56lUHMWZ0gYwrun72NHBzwjIMeFgKV3NgM0bA/exec";
  function Regist(big,middle,small,prompt){
    let url = registAPI;
    url += "?big=" + encodeURI(big);
    url += "&middle=" + encodeURI(middle);
    url += "&small=" + encodeURI(small);
    url += "&prompt=" + encodeURI(prompt);
    
    localPromptList.push( {"prompt" : prompt,"data":{0:big, 1:middle, 2:small}})
    fetch(url, {method: "Get",mode: "cors"})
    saveLocalList()
  }

  const toolMessageAPI = "https://script.google.com/macros/s/AKfycbzZlz_wVLkZRV6WR5iQSPGnnznAsvxq_2wECPDlfQY5GwaGyU6p0uN4-eAFgk_0Qpvk/exec"
  function loadMessage(){
    fetch(toolMessageAPI) 
    .then( response => response.json())
    .then( json => {  
      jsonLoop(json,(item,index)=>{
        switch(item.title){
          case "isAlert":
            if(item.value){
              $('#noticeTab').addClass('is-alert');
            }
            break;
          case "notice":
            $("#notice").text(item.value);
            break;
          case "latestDicUrl":
            masterDicDownload(item.value);
            break;
        }
      })
    });
  }
  
const translateAPI = "https://script.google.com/macros/s/AKfycbwDOhGpN40Xkg09AlH0YiB1C77h8qgCTF25YGHfbORCw-wAm7BQkBpLSrZCw28QOXCJHA/exec"
function translate(keyword,translateEvent){
  let url = translateAPI + "?search=" + encodeURI(keyword);
  fetch(url) 
  .then( response => response.json())
  .then( json => {  
    if(translateEvent){
    translateEvent(json)
    }
  });
}

function masterDicDownload(jsonURL){
  masterPrompts = []
  const xhr = new XMLHttpRequest();
  xhr.open("GET", jsonURL, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const jsonData = JSON.parse(xhr.responseText);
      jsonLoop(jsonData,(data)=>{
        masterPrompts.push( {"prompt" : data[3],"data":{0:data[0], 1:data[1], 2:data[2]}})
      })
    }
  };
  xhr.send();
};

