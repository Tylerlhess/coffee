// Popup script for Coffee extension
// Handles UI interactions and messaging with background script

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const factsList = document.getElementById('facts-list');
const opinionsList = document.getElementById('opinions-list');
const fallaciesList = document.getElementById('fallacies-list');
const evidenceList = document.getElementById('evidence-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.querySelector('#search-content .btn');
const investigateBtn = document.querySelector('#investigate-content .btn');

// Tab switching functionality
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and contents
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');
    document.getElementById(`${tabId}-content`).classList.add('active');
  });
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  // Send message to background script to analyze current page
  chrome.runtime.sendMessage({ action: "analyzePage" });
  
  // Update UI to show analysis in progress
  updateAnalysisStatus("Analyzing page content...");
});

// Listen for analysis results from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analysisComplete") {
    // Display results
    displayAnalysisResults(message.results);
  }
});

// Display analysis results
function displayAnalysisResults(results) {
  // Update UI status
  updateAnalysisStatus("Analysis complete!");
  
  // Clear previous results
  factsList.innerHTML = '';
  opinionsList.innerHTML = '';
  fallaciesList.innerHTML = '';
  evidenceList.innerHTML = '';
  
  // Display facts
  if (results.facts && results.facts.length > 0) {
    results.facts.forEach(fact => {
      const factElement = document.createElement('div');
      factElement.className = 'fact-item';
      factElement.innerHTML = `
        <div>${fact.text}</div>
        <span class="confidence">Confidence: ${(fact.confidence * 100).toFixed(0)}%</span>
      `;
      factsList.appendChild(factElement);
    });
  } else {
    factsList.innerHTML = '<div>No facts identified</div>';
  }
  
  // Display opinions
  if (results.opinions && results.opinions.length > 0) {
    results.opinions.forEach(opinion => {
      const opinionElement = document.createElement('div');
      opinionElement.className = 'opinion-item';
      opinionElement.innerHTML = `
        <div>${opinion.text}</div>
        <span class="confidence">Confidence: ${(opinion.confidence * 100).toFixed(0)}%</span>
      `;
      opinionsList.appendChild(opinionElement);
    });
  } else {
    opinionsList.innerHTML = '<div>No opinions identified</div>';
  }
  
  // Display fallacies
  if (results.fallacies && results.fallacies.length > 0) {
    results.fallacies.forEach(fallacy => {
      const fallacyElement = document.createElement('div');
      fallacyElement.className = 'fallacy-item';
      fallacyElement.innerHTML = `
        <div>${fallacy.type}</div>
        <div>${fallacy.description}</div>
        <span class="confidence">Confidence: ${(fallacy.confidence * 100).toFixed(0)}%</span>
      `;
      fallaciesList.appendChild(fallacyElement);
    });
  } else {
    fallaciesList.innerHTML = '<div>No fallacies identified</div>';
  }
  
  // Display evidence
  if (results.evidence && results.evidence.length > 0) {
    results.evidence.forEach(evidence => {
      const evidenceElement = document.createElement('div');
      evidenceElement.className = 'evidence-item';
      evidenceElement.innerHTML = `
        <div>Source: ${evidence.source}</div>
        <span class="confidence">Relevance: ${(evidence.relevance * 100).toFixed(0)}%</span>
      `;
      evidenceList.appendChild(evidenceElement);
    });
  } else {
    evidenceList.innerHTML = '<div>No evidence found</div>';
  }
}

// Update status message
function updateAnalysisStatus(message) {
  const statusElement = document.querySelector('.status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Search functionality
searchBtn.addEventListener('click', () => {
  const searchTerm = searchInput.value;
  if (searchTerm) {
    performSearch(searchTerm);
  }
});

// Perform a search
function performSearch(term) {
  // In a real implementation, this would call an AI search service
  updateSearchStatus(`Searching for: ${term}`);
  
  // Simulate search results
  setTimeout(() => {
    const searchResults = {
      query: term,
      results: [
        { title: "Sample search result 1", url: "https://example.com", snippet: "This is a sample search result" },
        { title: "Sample search result 2", url: "https://example.com", snippet: "This is another search result" }
      ]
    };
    
    displaySearchResults(searchResults);
  }, 1000);
}

// Display search results
function displaySearchResults(results) {
  const searchResultsContainer = document.getElementById('search-results');
  searchResultsContainer.innerHTML = '';
  
  const resultsHeader = document.createElement('h3');
  resultsHeader.textContent = `Results for: ${results.query}`;
  searchResultsContainer.appendChild(resultsHeader);
  
  results.results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.innerHTML = `
      <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd;">
        <h4><a href="${result.url}" target="_blank">${result.title}</a></h4>
        <p>${result.snippet}</p>
      </div>
    `;
    searchResultsContainer.appendChild(resultElement);
  });
}

// Update search status
function updateSearchStatus(message) {
  const searchStatus = document.getElementById('search-results');
  searchStatus.innerHTML = `<div style="text-align: center; padding: 10px;">${message}</div>`;
}

// Investigate with AI
investigateBtn.addEventListener('click', () => {
  // In a real implementation, this would call AI research services
  updateInvestigationStatus("Researching article with AI...");
  
  // Simulate AI analysis
  setTimeout(() => {
    const aiResults = {
      summary: "This article contains several claims that should be evaluated critically.",
      keyFindings: [
        { claim: "This is a fact", confidence: 0.85 },
        { claim: "This is an opinion", confidence: 0.75 }
      ],
      recommendations: [
        "Verify claims with independent sources",
        "Look for logical fallacies in reasoning"
      ]
    };
    
    displayInvestigationResults(aiResults);
  }, 2000);
});

// Display investigation results
function displayInvestigationResults(results) {
  const investigationContainer = document.getElementById('investigation-results');
  investigationContainer.innerHTML = `
    <div style="margin-top: 15px;">
      <h3>AI Analysis</h3>
      <p>${results.summary}</p>
      
      <h4>Key Findings</h4>
      ${results.keyFindings.map(finding => `
        <div style="margin: 5px 0;">
          <strong>${finding.claim}</strong> - Confidence: ${(finding.confidence * 100).toFixed(0)}%
        </div>
      `).join('')}
      
      <h4>Recommendations</h4>
      ${results.recommendations.map(rec => `<p>• ${rec}</p>`).join('')}
    </div>
  `;
}

// Update investigation status
function updateInvestigationStatus(message) {
  const investigationContainer = document.getElementById('investigation-results');
  investigationContainer.innerHTML = `<div style="text-align: center; padding: 10px;">${message}</div>`;
}