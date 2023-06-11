let toolInfo = {
  searchAPI:"https://script.google.com/macros/s/AKfycbw5wriSPR1rLbLPDZi4g6a42Ndtq-Nswc3CaCaWrDIGLgB01J-jdsH5WlHJpfpBmJyCQg/exec",
  registAPI:"https://script.google.com/macros/s/AKfycbwsG9RUpvBo80seZTeyHq6Kyr-dN28ua56lUHMWZ0gYwrun72NHBzwjIMeFgKV3NgM0bA/exec",
  translateAPI:"https://script.google.com/macros/s/AKfycbxLhc0j7jQ6GwrQNEvpRNweDBjvOY4pkx8kFyhmBfc59IASjsp19TpiNuTipZsoQFyUjw/exec",
  translateDeeplAPI:"https://script.google.com/macros/s/AKfycbwVu5_ALUyf378gTAq1UcmDVrJQbzhFBKJW828zsiRms2dGvDWJFyf0CGJ9_KhvlBWMOQ/exec",
}

const toolMessageAPI = "https://script.google.com/macros/s/AKfycbxwWkdzoWzo8kvnAX84AXuLr0ApoIzrEnU_s88v5JIXBEDvLf0VIyET5Da2tZGTajhj/exec"
function loadMessage() {
  fetch(toolMessageAPI)
    .then(response => response.json())
    .then(json => {
      $("#notice").text("")
      jsonLoop(json, (item, index) => {
        toolInfo[item.title]=item.value
        switch (item.title) {
          case "latestToolVer":
            if (toolVersion < item.value) {
              $('#noticeTab').addClass('is-alert');
              $("#notice").text("最新のバージョンがあります");
            }
            break;
          case "isAlert":
            if (item.value) {
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
      console.log($("#notice").text())
    });
}

function SearchLogAPI(search) {
  let url = toolInfo.searchAPI + "?search=" + encodeURI(search);
  fetch(url, { method: "Get", mode: "cors" })
}

function RegistAPI(big, middle, small, prompt) {
  let url = toolInfo.registAPI;
  url += "?big=" + encodeURI(big);
  url += "&middle=" + encodeURI(middle);
  url += "&small=" + encodeURI(small);
  url += "&prompt=" + encodeURI(prompt);
  fetch(url, { method: "Get", mode: "cors" })
}

function translate(keyword, translateEvent) {
  let url = toolInfo.translateAPI + "?search=" + encodeURI(keyword);
  fetch(url)
    .then(response => response.json())
    .then(json => {
      if (translateEvent) {
        translateEvent(json)
      }
    });
}

function translateDeepl(keyword, authKey, translateEvent) {
  let url = toolInfo.translateDeeplAPI + "?search=" + encodeURI(keyword) + "&authKey=" + encodeURI(authKey);
  fetch(url)
    .then(response => response.json())
    .then(json => {
      if (translateEvent) {
        translateEvent(json)
      }
    });
}

function masterDicDownload(jsonURL) {
  masterPrompts = []
  const xhr = new XMLHttpRequest();
  xhr.open("GET", jsonURL, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const jsonData = JSON.parse(xhr.responseText);
      jsonLoop(jsonData, (data) => {
        masterPrompts.push({ "prompt": data[3], "data": { 0: data[0], 1: data[1], 2: data[2] }, "url": data[4] })
      })
      categoryData.update()
      console.log(masterPrompts)
    }
  };
  xhr.send();
};

