const registAPI = "https://script.google.com/macros/s/AKfycbwsG9RUpvBo80seZTeyHq6Kyr-dN28ua56lUHMWZ0gYwrun72NHBzwjIMeFgKV3NgM0bA/exec";
const searchAPI = "https://script.google.com/macros/s/AKfycbz2ev7z3ay_v8NwlTLX84obKIyCLltlHwY3DKEMsF8Po8dcrH_-GdKhWTT_WD4ze4vxxA/exec";
const toolMessageAPI = "https://script.google.com/macros/s/AKfycbzZlz_wVLkZRV6WR5iQSPGnnznAsvxq_2wECPDlfQY5GwaGyU6p0uN4-eAFgk_0Qpvk/exec"

let isSearch = false
function Search(search){
    if(isSearch){
      return
    }
    resetPromptList("#promptList")
  
    isSearch=true;
    $("#isSearch").html("検索中");
    let url = searchAPI + "?search=" + encodeURI(search);
    console.log(url)
    fetch(url) 
      .then( response => response.json())
      .then( json => {  
        console.log(localPromptList)
        jsonLoop(localPromptList,function(item,index){
            let tmp = item.data[0] + item.data[1] + item.data[2] + item.prompt;
            let searchCheck = tmp.includes(search)
            if (searchCheck){
              json[Object.keys(json).length]=item
            }
        })
        createSearchList(json,"#promptList");
        isSearch=false;
        $("#isSearch").html("");
      }
    );
  }
  
  function Regist(big,middle,small,prompt){
    let url = registAPI;
    url += "?big=" + encodeURI(big);
    url += "&middle=" + encodeURI(middle);
    url += "&small=" + encodeURI(small);
    url += "&prompt=" + encodeURI(prompt);
    
    localPromptList.push( {
      "prompt" : prompt,
      "data":{0:big, 1:middle, 2:small}
    })
    
    fetch(url, {
      method: "Get",
      mode: "cors"
    })
    saveLocalList()
    addInit()
  }

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
        }
      })
    }
  );
  }