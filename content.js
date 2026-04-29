// Content script for Coffee extension
// This script analyzes web pages and identifies facts, opinions, fallacies, and evidence

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyzePage") {
    analyzePageContent();
  }
});

// Main analysis function
function analyzePageContent() {
  // Get the current page title and content
  const title = document.title;
  const content = document.body.innerText;
  
  // Send analysis to background script
  chrome.runtime.sendMessage({
    action: "pageAnalysis",
    data: {
      title: title,
      content: content,
      url: window.location.href
    }
  });
}

// Export the analysis function for use in other parts of the extension
window.Coffee = {
  analyzePage: analyzePageContent
};