# NDJSON Post Viewer

A lightweight web application for browsing and managing your social media posts and comments stored in NDJSON format.

---

## ✨ Features

- **View Posts and Comments**: Import and browse your social media data in a clean, easy-to-read format  
- **Smart Filtering**: Filter by post type (text or link posts), saved items, or by keyword search  
- **Sorting Options**: Sort your content by date, score, or text length  
- **Reading Progress**: Resume where you left off with automatic progress tracking  
- **Saved Items**: Star posts and comments to save them for later reference  
- **Read/Unread Status**: Track which posts you've already viewed  
- **Eye-Friendly Modes**: Choose between Light, Dark Gray, or True Black themes  
- **Customizable Text**: Adjust font size and line spacing for comfortable reading  
- **Mobile Friendly**: Responsive design with swipe navigation for mobile devices  
- **Offline Capability**: Works offline as a Progressive Web App (PWA)  

---

## 🚀 Usage

1. Open the app in any modern web browser  
2. Click **"Choose File"** and select your NDJSON data file  
3. Click **"Done"** to load your content  
4. Browse your posts using the provided filters and navigation controls  

---

## 📄 Data Format

The application works with NDJSON files (Newline Delimited JSON) containing post data. Each line should be a valid JSON object representing a post or comment with fields like:

```json
{
  "title": "Post title (for posts only)",
  "selftext": "The content text",
  "author": "Username of the author",
  "created_utc": "Creation timestamp",
  "score": "Post score/rating",
  "subreddit": "The community/forum name",
  "is_self": true,
  "url": "URL for link posts"
}
```

---

## 🔐 Privacy

This application runs entirely in your browser. **Your data never leaves your device** – no information is uploaded to any server.

---

## 📦 Installation

### Option 1: Use Online Version

Visit: [https://botpeac.github.io/euid](https://botpeac.github.io/euid)

### Option 2: Install as PWA

Depending on your browser and platform, installation may work differently:

#### On Mobile (iOS/Android)

1. Open the app in your mobile browser (Safari on iOS, Chrome on Android)
2. Tap the browser's **Share** or **Menu** button
3. Select **"Add to Home Screen"**
4. The app will now appear on your home screen and run like a native app

### Option 3: Host Locally

```bash
git clone https://github.com/botpeac/euid.git
cd euid
open index.html
```

---

## 🌐 Browser Compatibility

- Chrome / Edge (latest versions)  
- Firefox (latest version)  
- Safari (latest version)  
- Mobile browsers (iOS Safari, Android Chrome)  

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

- Built with vanilla JavaScript, HTML, and CSS  
- No external dependencies required
