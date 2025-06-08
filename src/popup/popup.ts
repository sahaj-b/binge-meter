const toggleButton = document.getElementById("toggle-button");
if (!toggleButton) {
  throw new Error("Toggle button not found in popup HTML");
}
toggleButton.addEventListener("click", () => {
  console.log("Toggle button clicked");
  chrome.runtime.sendMessage({ type: "TOGGLE_ALL_OVERLAYS" });
});
