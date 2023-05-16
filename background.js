// DOM処理系 
function StableDiffusion(arg) {
    console.log("call StableDiffusion")
    console.log(arg)
    var ele1 = document.getElementById("txt2img_prompt");
    var ele2 = document.getElementById("txt2img_neg_prompt");
    var ele3 = document.getElementById("txt2img_generate");
    var ele4 = document.getElementById("lightboxModal");
    
    console.log(document.body)

    // 何故か要素が取れない
    console.log(ele1)
    console.log(ele2)
    console.log(ele3)
    console.log(ele4)
    console.log(document.getElementById("root"))
    console.log(document.getElementById("component-756"))
}

function NovelAI(arg) {
    console.log("call NovelAI")
    console.log(arg)
    switch(arg[0]){
        case "Positive":{
            let ele = document.getElementById("prompt-input-0");
            ele.value += arg[1];
            break;
        }
        case "Negative":{
            let ele = document.getElementsByTagName("textarea")[0];
            ele.value += arg[1];
            break;
        }
        case "Generate":{
            let ele = document.getElementsByClassName("sc-75a56bc9-37 jMyFmP")[0];
            ele.click();
            break;
        }
        case "GetPositive":{
            let ele = document.getElementById("prompt-input-0");
            console.log("GetPositive");
            return {code:ele.value};
        }
    }
}
// DOM処理系終了

// popUp_scriptからのメッセージ
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request.args);
    chrome.tabs.query({}, tabs => {
        for(let i=0; i<tabs.length; i++){
            if (tabs[i].active){
                console.log(tabs[i])
                switch(tabs[i].title){
                    case "Stable Diffusion":
                        chrome.scripting.executeScript({target: { tabId: tabs[i].id },func:StableDiffusion,args:[request.args]},(ret)=>{
                            console.log("DOM操作完了");
                            console.log( ret[0].result.code);
                            sendResponse({ text: ret[0].result.code });
                        });
                        break;
                    case "Image Generation - NovelAI":
                        chrome.scripting.executeScript({target: { tabId: tabs[i].id },func:NovelAI,args:[request.args]},(ret)=>{
                            console.log("DOM操作完了");
                            console.log( ret[0].result.code);
                            sendResponse({ text: ret[0].result.code });
                        });
                        break;
                }
            }
        }
    });

    sendResponse({ text: "バックグラウンド処理の終了" });
});
// popUp_scriptからのメッセージ終了