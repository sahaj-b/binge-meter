const toggleButton = document.getElementById("toggle-button");
if (!toggleButton) {
  throw new Error("Toggle button not found in popup HTML");
}
toggleButton.addEventListener("click", () => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_OVERLAY" });
    });
  });
});
