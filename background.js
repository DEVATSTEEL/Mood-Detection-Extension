let sentimentHistory = [];

// Load existing sentiment history from local storage
chrome.storage.local.get("sentimentHistory", (data) => {
    if (data.sentimentHistory) {
        sentimentHistory = data.sentimentHistory;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "analyze-sentiment",
        title: "Analyze Sentiment",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "analyze-sentiment" && info.selectionText) {
        const selectedText = info.selectionText.trim();
        if (!selectedText) return console.warn("[EXTENSION] No text selected.");

        try {
            const response = await fetch("http://54.234.165.230:5000/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: selectedText })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            if (!data || !data.emotions || Object.keys(data.emotions).length === 0) {
                throw new Error("No valid sentiment data received from API");
            }

            console.log("[EXTENSION] API Response:", data);

            // Store sentiment in local storage (limit to 100 entries)
            const MAX_HISTORY = 100;
            const newSentiment = { text: selectedText, sentiment: data };
            sentimentHistory.push(newSentiment);

            if (sentimentHistory.length > MAX_HISTORY) {
                sentimentHistory.shift(); // Remove oldest entry
            }

            chrome.storage.local.set({ sentimentHistory }, () => {
                console.log("[EXTENSION] Sentiment saved successfully.");
            });

            // Ensure content script is injected before sending data
            await injectContentScript(tab.id);

            // Send sentiment data to the content script
            chrome.tabs.sendMessage(tab.id, {
                action: "display-sentiment",
                sentiment: data,
                text: selectedText
            });
        } catch (error) {
            console.error("[EXTENSION] Error fetching sentiment:", error.message);
            await injectContentScript(tab.id);
            chrome.tabs.sendMessage(tab.id, {
                action: "display-sentiment",
                error: "Error fetching sentiment"
            });
        }
    }
});

async function injectContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
        });
        console.log("[EXTENSION] Content script injected.");
    } catch (error) {
        console.error("[EXTENSION] Failed to inject content script:", error);
    }
}

// Listen for requests from popup.js to fetch stored sentiments
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "get-sentiments") {
        chrome.storage.local.get("sentimentHistory", (data) => {
            sendResponse({ data: data.sentimentHistory || [] });
        });
        return true; // Required for asynchronous sendResponse
    }
});
