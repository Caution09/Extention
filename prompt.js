let input = document.getElementById('promptInput'); 
input.focus();

document.addEventListener("DOMContentLoaded", () => {
    const promptInput = document.getElementById("promptInput");
    const submitButton = document.getElementById("submitButton");
  
    submitButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "promptResponse", text: promptInput.value },()=>{
            window.close();
        });
    });

    promptInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            chrome.runtime.sendMessage({ type: "promptResponse", text: promptInput.value },()=>{
                window.close();
            });
        }
    });
});