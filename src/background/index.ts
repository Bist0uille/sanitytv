chrome.runtime.onInstalled.addListener((details) => {
  console.info('[SanityTV] installed', details.reason);
});
