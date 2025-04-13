// Previous code that we have already set up
document.addEventListener("DOMContentLoaded", function () {
    const sentimentDisplay = document.getElementById("sentiment-content");
    const savedSentimentsDiv = document.getElementById("saved-sentiments");
    const viewButton = document.getElementById("view-sentiments-btn");

    // Fetch stored sentiments
    chrome.storage.local.get("sentimentHistory", (data) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Error fetching sentiment:", chrome.runtime.lastError);
            sentimentDisplay.innerText = "Failed to load sentiments.";
            return;
        }

        const sentiments = data.sentimentHistory || [];

        if (!Array.isArray(sentiments) || sentiments.length === 0) {
            sentimentDisplay.innerText = "No sentiment data found.";
            return;
        }

        // Get the latest sentiment (last item in the array)
        const latestSentiment = sentiments[sentiments.length - 1];

        // Ensure the latest sentiment has a valid structure
        if (!latestSentiment || !latestSentiment.sentiment || !latestSentiment.sentiment.emotions) {
            sentimentDisplay.innerText = "Invalid sentiment data format.";
            return;
        }

        sentimentDisplay.innerHTML = `
            <h3>Latest Sentiment:</h3>
            <p><strong>Text:</strong> ${latestSentiment.text || "N/A"}</p>
            <p><strong>Emotions:</strong></p>
            <ul>${formatEmotionsAsList(latestSentiment.sentiment.emotions)}</ul>
        `;

        // Event listener for "View Saved Sentiments" button
        viewButton.addEventListener("click", function () {
            if (savedSentimentsDiv.style.display === "none") {
                savedSentimentsDiv.style.display = "block";

                // Display all saved sentiments in reverse order (latest first)
                savedSentimentsDiv.innerHTML = `
                    <h3>Saved Sentiments:</h3>
                    ${sentiments.reverse().map((sentiment, index) => {
                        // Ensure each sentiment has a valid structure before rendering
                        if (!sentiment || !sentiment.sentiment || !sentiment.sentiment.emotions) {
                            return `<p><strong>${index + 1}.</strong> Invalid sentiment data.</p>`;
                        }
                        return `
                            <div class="sentiment-entry">
                                <p><strong>${index + 1}. Text:</strong> ${sentiment.text || "N/A"}</p>
                                <ul>${formatEmotionsAsList(sentiment.sentiment.emotions)}</ul>
                            </div>
                        `;
                    }).join("")}
                `;

                viewButton.innerText = "Hide Saved Sentiments";
            } else {
                savedSentimentsDiv.style.display = "none";
                viewButton.innerText = "View Saved Sentiments";
            }
        });
    });
});

// Helper function to format emotions as a list with emojis
function formatEmotionsAsList(emotions) {
    if (!emotions || typeof emotions !== "object") return "<li>No emotions available</li>";

    return Object.entries(emotions)
        .map(([emotion, score]) => {
            let emoji = {
                anger: "😡",
                disgust: "🤢",
                fear: "😨",
                joy: "😊",
                neutral: "😐",
                sadness: "😢",
                surprise: "😲"
            }[emotion] || "❓";

            return `<li><strong>${emotion.charAt(0).toUpperCase() + emotion.slice(1)}:</strong> ${score.toFixed(2)} ${emoji}</li>`;
        })
        .join("");
}

document.getElementById('save-sentiment').addEventListener('click', async () => {
    const sentimentContent = document.getElementById("sentiment-content");

    if (!sentimentContent || sentimentContent.innerText.trim() === "") {
        alert("No sentiment available to save.");
        return;
    }

    // Extract sentiment text and emotions from displayed HTML
    const sentimentText = extractSentimentText(sentimentContent);
    const emotions = extractEmotionsFromHTML();

    console.log("📥 Extracted Sentiment:", sentimentText);
    console.log("📊 Extracted Emotions:", emotions);

    if (!sentimentText || Object.keys(emotions).length === 0) {
        alert("No sentiment available to save.");
        return;
    }

    const latestSentiment = { text: sentimentText, emotions };

    // Save to Firebase
    try {
        const response = await fetch("http://localhost:3000/save-sentiment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(latestSentiment)
        });

        const result = await response.json();
        console.log("📡 Server Response:", result);

        if (!response.ok) throw new Error(`Server Error: ${response.status} - ${response.statusText}`);

        console.log("✅ Sentiment saved to the cloud.");
        alert("Sentiment saved successfully to the cloud!");
    } catch (error) {
        console.error("❌ Error saving sentiment:", error);
        alert("Failed to save sentiment in the cloud.");
    }
});

// ✅ Helper function to extract sentiment text
function extractSentimentText(container) {
    const lines = container.innerText.split("\n");
    for (let line of lines) {
        if (line.startsWith("Text:")) {
            return line.replace("Text:", "").trim();
        }
    }
    return "";
}

// ✅ Helper function to extract emotions from the displayed HTML
function extractEmotionsFromHTML() {
    const emotions = {};
    document.querySelectorAll("#sentiment-content li").forEach(emotionEl => {
        const parts = emotionEl.innerText.split(":");
        if (parts.length === 2) {
            const emotionName = parts[0].trim().toLowerCase();
            const emotionValue = parseFloat(parts[1].trim());
            if (!isNaN(emotionValue)) {
                emotions[emotionName] = emotionValue;
            }
        }
    });
    return emotions;
}
