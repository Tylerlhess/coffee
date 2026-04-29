# Coffee - News Fact Checker Chrome Extension

Coffee is a Chrome extension designed to help users critically evaluate news articles by identifying facts, opinions, logical fallacies, and evidence. The extension aims to "wake people up to their news" by providing tools for media literacy and critical thinking.

## Features

### 1. Fact Identification
- Highlights factual statements in articles
- Provides confidence levels for each identified fact
- Distinguishes facts from opinions

### 2. Opinion Detection
- Identifies opinion-based statements
- Labels statements as subjective or subjective
- Provides confidence scores

### 3. Logical Fallacy Detection
- Detects common logical fallacies
- Highlights reasoning errors
- Provides explanations for each fallacy found

### 4. Evidence Research
- Searches for supporting and contradicting evidence
- Provides source reliability information
- Shows relevance scores

### 5. AI-Powered Investigation
- Analyzes articles with artificial intelligence
- Provides summary of key findings
- Offers recommendations for further research

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the project directory

## Usage

1. Click the Coffee icon in the Chrome toolbar
2. The extension will analyze the current page
3. View results in the popup interface:
   - Facts: Green highlights
   - Opinions: Yellow highlights
   - Fallacies: Red highlights
   - Evidence: Blue highlights
4. Use the Search tab to research specific claims
5. Use the Investigate tab for AI-powered analysis

## Technical Details

### Architecture
- **Manifest v3**: Uses Chrome Extension Manifest v3
- **Service Worker**: Background processing
- **Content Scripts**: Page analysis
- **Popup UI**: User interface

### Files
- `manifest.json`: Extension configuration
- `content.js`: Page analysis
- `background.js`: Extension logic
- `popup.html`: User interface
- `popup.js`: Popup interactions

## Roadmap

### Phase 1: Core Analysis
- [x] Basic extension structure
- [x] Page content analysis
- [x] Fact/opinion identification
- [x] Fallacy detection
- [x] Evidence search

### Phase 2: AI Enhancement
- [ ] Integration with AI services
- [ ] Natural language processing
- [ ] Enhanced fact-checking

### Phase 3: Advanced Features
- [ ] Cross-referencing with multiple sources
- [ ] Sentiment analysis
- [ ] Social sharing of analyses

## License

MIT License

## Contributing

Feel free to fork the repository and submit pull requests to improve the extension.

## Support

For questions or feedback, please create an issue in the repository.