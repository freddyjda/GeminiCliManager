# Gemini CLI Manager

<div align="center">

![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

**A desktop application to manage multiple Google Gemini CLI accounts with ease.**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Screenshots](#screenshots) • [Contributing](#contributing)

</div>

---

## 🚀 Features

- **👤 Multi-Account Management** - Switch between multiple Google accounts seamlessly
- **🔐 Native Google Login** - Uses the same OAuth flow as the official Gemini CLI
- **💾 Persistent Storage** - Your accounts are saved locally and synced with the CLI
- **🎨 Modern UI** - Clean, dark-themed interface built with React
- **⚡ Fast Switching** - Change accounts with a single click
- **🔄 Auto-Sync** - Credentials automatically sync with your Gemini CLI installation

> **Note:** This app uses the same OAuth credentials as the official [Gemini CLI](https://github.com/google-gemini/gemini-cli), which are designed for public use in installed applications as per [Google's OAuth documentation](https://developers.google.com/identity/protocols/oauth2#installed).

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed globally

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/GeminiCliManager.git

# Navigate to the project
cd GeminiCliManager

# Install dependencies
npm install

# Start the application
npm start
```

## 🎯 Usage

### Adding an Account

1. Click the **+** button in the top right
2. Complete the Google login in your browser
3. Your account will appear in the list automatically

### Switching Accounts

1. Click on any account in the backup accounts list
2. The credentials will be synced to your Gemini CLI
3. Use `gemini` in your terminal with the new account

### Account Storage

All accounts are stored in:
```
~/.gemini/cli-users/
```

The active account is also synced to:
```
~/.gemini/oauth_creds.json
~/.gemini/google_accounts.json
```

## 🖼️ Screenshots

*Coming soon*

## 🛠️ Development

```bash
# Run in development mode with hot reload
npm start

# Build for production
npm run build

# Package as executable
npm run package
```

## 📁 Project Structure

```
GeminiCliManager/
├── electron/           # Electron main process
│   ├── main.ts        # Main entry point
│   ├── preload.ts     # Preload script for IPC
│   └── services/      # Backend services
│       ├── AuthService.ts       # OAuth implementation
│       └── GeminiFileService.ts # Account file management
├── src/               # React frontend
│   ├── App.tsx        # Main React component
│   └── index.css      # Styles
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) for the OAuth implementation reference
- [Electron](https://www.electronjs.org/) for the desktop framework
- [React](https://react.dev/) for the UI library

---

<div align="center">

Made with ❤️ by [Freddy Diaz](https://github.com/YOUR_USERNAME)

</div>
