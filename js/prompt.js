let input = document.getElementById("promptInput");
input.focus();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Message received:", request); // デバッグ追加
});

document.addEventListener("DOMContentLoaded", () => {
  const promptInput = document.getElementById("promptInput");
  const submitButton = document.getElementById("submitButton");

  submitButton.addEventListener("click", () => {
    console.log("Submit button clicked"); // デバッグ追加
    console.log("Input value:", promptInput.value); // デバッグ追加

    chrome.runtime.sendMessage(
      { type: "promptResponse", text: promptInput.value },
      (response) => {
        console.log("Response received:", response); // デバッグ追加
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError);
        } else {
          window.close();
        }
      }
    );
  });

  promptInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      console.log("Enter key pressed"); // デバッグ追加

      chrome.runtime.sendMessage(
        { type: "promptResponse", text: promptInput.value },
        (response) => {
          console.log("Response received:", response); // デバッグ追加
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError);
          } else {
            window.close();
          }
        }
      );
    }
  });
});
