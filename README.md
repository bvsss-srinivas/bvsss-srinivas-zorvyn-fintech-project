# Finance Dashboard SPA 

A premium, responsive Single Page Application (SPA) designed to track expenses, visualize income, and manage a mock virtual wallet. The interface heavily prioritizes deep user experience (UX) and clean, modern user interfaces (UI) using Glassmorphism, dynamic animations, and state persistence.

## Overview of Approach
This project was built to prioritize simplicity, speed, and modern UI/UX design without the overhead of heavy frameworks like React or a complex backend. 
- **Design Decisions:** I chose a centralized static dashboard layout utilizing CSS Grid and Flexbox for maximum cross-device responsiveness. 
- **State Management:** To handle dynamic interactions (like Filtering and Role-Based Access Control) without a database, I implemented a robust Vanilla JavaScript architecture that serializes Data Models natively to the browser's `localStorage` API. 
- **Scalability:** By keeping the UI highly modularized into core view blocks (`#dashboard`, `#transactions`, `#insights`), the app behaves smoothly as a Single Page Application (SPA).
##  Features

### Core Functionality
- **Transaction CRUD:** Add, Edit, and Delete transactions instantly.
- **Data Persistence:** Built entirely on top of browser `localStorage`. No database required! Your data fiercely remains even after page refreshes.
- **Dynamic Charting:** Features a real-time Line Chart for balance over time and a Doughnut Chart for expense categories using `Chart.js`.
- **RBAC (Role-Based Access Control):** Global toggle between `Admin` and `Viewer`. When set to Viewer, the UI dynamically disables destructive actions, greying-out transfer buttons and hiding the ability to add or delete transactions.

### Advanced Features
- **CSV Export:** Admins have the ability to click `Export` to instantaneously parse their entire ledger into a downloadable `.csv` file.
- **Advanced Filtering:** Combines string-search mapping with nested `<select>` dropdowns for precise multi-level slicing of categories and types.
- **AI Insights:** Algorithmically calculates your highest expense categories and calculates net-savings differentials, throwing warnings if you spend more than you earn.
- **Native Toast System:** Built a custom animated notification hook replacing all standard browser `alert()` pop-ups for seamless feedback.

### UI / UX Polish
- **Dark Mode vs Light Mode:** Fully responsive theme switcher mapping CSS variables.
- **Dynamic Loading States:** Buttons turn off and simulate async latency with `Processing...` or `Saving...` micro-animations directly inside the form blocks.
- **Inline Validation:** The system refuses mathematically incorrect transfers (e.g., spending more than your total balance) with custom inline red text prompts inside the form context.
- **Interactive Wallet:** Mock Credit Cards utilizing complex CSS dropshadows, backdrop-filters, and 3D hover metrics.

##  Tech Stack
- **HTML5** (Semantic structuring)
- **CSS3** (CSS Grid, Flexbox, Variable Theming, Keyframe animations)
- **Vanilla JavaScript ES6+** (Event delegation, DOM manipulation, Array mapping, LocalStorage API)
- **Chart.js v3** (Via CDN)
- **Google Fonts** (Outfit typography)
- **Material Symbols** (Icons)

## How to Run Locally

Because this project is built entirely on native web standards and `localStorage`, no `npm` packages or build steps are required.

Simply serve the files using any local development server:

### Using Python:
```bash
# Open your terminal in the project directory
python -m http.server 8080
# Open your browser and navigate to http://127.0.0.1:8080
```

### Using VS Code:
1. Open the folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right click `index.html` -> **"Open with Live Server"**.


---
*Built with modern frontend architecture patterns in mind.*
