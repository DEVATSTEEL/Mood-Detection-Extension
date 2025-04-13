chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[EXTENSION] Received message in content script:", message);

    if (message.action === "display-sentiment") {
        const sentimentData = cleanResponse(message.sentiment);
        const selectedText = message.text || "No text available";

        if (!sentimentData || !sentimentData.emotions) {
            console.error("[EXTENSION] Error: No valid sentiment data received.");
            showFloatingMessage("Error: No valid sentiment data received.", "error");
            return;
        }

        console.log("[EXTENSION] Processed Sentiment Data:", sentimentData);
        createSentimentPopup(selectedText, sentimentData.emotions);
    }
});

function createSentimentPopup(selectedText, emotions) {
    console.log("[EXTENSION] Displaying Sentiment Popup...");

    document.querySelectorAll(".sentiment-popup").forEach(el => el.remove());

    const sentimentBox = document.createElement("div");
    sentimentBox.classList.add("sentiment-popup");
    sentimentBox.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: auto;
        min-width: 250px;
        max-width: 400px;
        padding: 15px;
        background: #222;
        color: #fff;
        font-size: 14px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        overflow-wrap: break-word;
        font-family: Arial, sans-serif;
        max-height: 400px;
        overflow-y: auto;
        transition: opacity 0.3s ease-in-out;
        opacity: 0;
    `;

    let sentimentText = `
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
            Sentiment Analysis Result
        </div>
        <div><strong>Text:</strong> <br>
        <span style="font-style: italic; color: #ddd;">"${selectedText}"</span></div>
        <br>
        <div><strong>Emotions:</strong></div>
        <hr style="border: 0.5px solid #555; margin: 5px 0;">
    `;

    // Sort emotions by value in descending order
    const sortedEmotions = Object.entries(emotions).sort((a, b) => b[1] - a[1]);

    // Extract the top 3 emotions
    const topEmotions = new Set(sortedEmotions.slice(0, 3).map(([emotion]) => emotion));

    let colors = {
        "anger": "#dc3545", "disgust": "#6c757d", "fear": "#ffc107",
        "joy": "#28a745", "neutral": "#6c757d", "sadness": "#007bff", "surprise": "#17a2b8"
    };
    let emojis = { "anger": "😡", "disgust": "🤢", "fear": "😨", "joy": "😊", "neutral": "😐", "sadness": "😢", "surprise": "😲" };

    sortedEmotions.forEach(([emotion, value]) => {
        let color = colors[emotion] || "#fff";
        let emoji = emojis[emotion] || "😐";
        let highlightStyle = topEmotions.has(emotion)
            ? "background: rgba(255, 255, 255, 0.2); padding: 5px; border-radius: 5px;"
            : "";

        sentimentText += `
            <div style="margin-bottom: 5px; ${highlightStyle}">
                <strong style="color: ${color};">${capitalize(emotion)}:</strong> ${value.toFixed(2)} ${emoji}
            </div>
        `;
    });

    sentimentBox.innerHTML = sentimentText;

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        color: #fff;
        font-size: 18px;
        cursor: pointer;
    `;
    closeButton.addEventListener("click", () => sentimentBox.remove());

    sentimentBox.appendChild(closeButton);
    document.body.appendChild(sentimentBox);

    requestAnimationFrame(() => sentimentBox.style.opacity = "1");

    setTimeout(() => sentimentBox.remove(), 10000);
}

function cleanResponse(data) {
    return data && typeof data === "object" ? data : null;
}

function showFloatingMessage(message, type) {
    document.querySelectorAll(".floating-message").forEach(el => el.remove());

    const msgBox = document.createElement("div");
    msgBox.classList.add("floating-message");
    msgBox.textContent = message;
    msgBox.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        max-width: 320px;
        padding: 12px;
        background-color: ${type === "error" ? "rgba(255, 0, 0, 0.8)" : "rgba(40, 167, 69, 0.9)"};
        color: white;
        font-size: 14px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: Arial, sans-serif;
        transition: opacity 0.3s ease-in-out;
        opacity: 0;
    `;

    document.body.appendChild(msgBox);
    requestAnimationFrame(() => msgBox.style.opacity = "1");

    setTimeout(() => {
        msgBox.style.opacity = "0";
        setTimeout(() => msgBox.remove(), 300);
    }, 5000);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
