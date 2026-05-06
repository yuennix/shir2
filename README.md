# BOOST-SH v1.1 - Facebook Mass Sharing Tool

```
    ██████╗  ██████╗  ██████╗ ███████╗████████╗    ███████╗██╗  ██╗
    ██╔══██╗██╔═══██╗██╔═══██╗██╔════╝╚══██╔══╝    ██╔════╝██║  ██║
    ██████╔╝██║   ██║██║   ██║███████╗   ██║       ███████╗███████║
    ██╔══██╗██║   ██║██║   ██║╚════██║   ██║       ╚════██║██╔══██║
    ██████╔╝╚██████╔╝╚██████╔╝███████║   ██║       ███████║██║  ██║
    ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝       ╚══════╝╚═╝  ╚═╝
```

> ⚡ SPAMSHARE BY: WEYN DUMP ⚡  
> Made by Jhames Martin | PH Edition 2025 | Version 1.1

---

## 📱 How to Run on Termux (Android)

### Step 1 — Install Termux
Download **Termux** from F-Droid (recommended) or Google Play Store.
- F-Droid: https://f-droid.org/packages/com.termux/

---

### Step 2 — Update & Install Required Packages
Open Termux and run these commands one by one:

```bash
pkg update && pkg upgrade -y
pkg install git nodejs -y
```

---

### Step 3 — Clone the Repository
```bash
git clone https://github.com/yuennix/shir2.git
```

---

### Step 4 — Go Into the Folder
```bash
cd shir2
```

---

### Step 5 — Run the App
```bash
node weynshare.js
```

That's it! The app will launch with the animated banner and main menu.

---

## 🔁 Running Again Later

Every time you want to use it, just open Termux and run:

```bash
cd shir2
node weynshare.js
```

---

## 📋 Main Menu Options

```
┌──────────────────────────────────────────────────────────────┐
│ BOOST-SH v1.1 MENU            │ STORED: X                    │
├──────────────────────────────────────────────────────────────┤
│ [1] Add Account               │ [5] Mass Share               │
│ [2] List Accounts             │ [6] Statistics               │
│ [3] Remove Account            │ [7] Check Live Status        │
│ [4] Single Share              │ [8] Cooldown                 │
│                       [9] Test All Accounts                  │
├──────────────────────────────────────────────────────────────┤
│               ⚡ SPAMSHARE BY: WEYN DUMP ⚡                  │
└──────────────────────────────────────────────────────────────┘
```

| Option | Description |
|--------|-------------|
| `[1]` Add Account | Add Facebook accounts using cookies (single or bulk) |
| `[2]` List Accounts | View all registered accounts |
| `[3]` Remove Account | Delete an account |
| `[4]` Single Share | Share with one specific account |
| `[5]` Mass Share | Ultra-fast bulk sharing across all accounts |
| `[6]` Statistics | View detailed sharing statistics |
| `[7]` Check Live Status | Instantly view account statuses |
| `[8]` Cooldown | View accounts under rate-limit cooldown |
| `[9]` Test All Accounts | Test all accounts with a real share |

> Press **Ctrl+C** to exit the app anytime.

---

## 🍪 How to Get Facebook Cookies

1. Open **Facebook** in your phone or PC browser
2. Open **Developer Tools** → Application → Cookies
3. Copy the full cookie string that includes:
   - `c_user=`
   - `xs=`
   - `datr=`
   - `fr=`
4. Paste it into the app when adding an account

---

## 📦 Bulk Cookie Import

1. Select `[1]` Add Account
2. Choose `[2]` Bulk Import
3. Paste cookies **one per line**
4. Press **Enter on an empty line** when done

---

## ⚡ Features

- 🔥 **Ultra-fast mass sharing** — 50 concurrent requests per account
- 📱 **Mobile-optimized UI** — fits perfectly on Termux Android screen
- 🌈 **Animated gradient menu** — purple, pink, cyan, light blue colors
- 💾 **Persistent storage** — accounts saved in `accounts.json`, never lost on exit
- 🔄 **Auto cooldown management** — rate-limited accounts auto-recover after 30 min
- 👥 **Multi-account support** — unlimited Facebook accounts
- 📊 **Real-time statistics** — track shares and success rates

---

## 🛠 Requirements

- Android phone with **Termux** installed
- **Node.js** (installed via `pkg install nodejs`)
- Valid Facebook account cookies

---

## ⚠️ Notes

- Your accounts are stored in `accounts.json` and will **not be deleted** when you exit Termux
- If an account hits a rate limit, it goes into **30-minute cooldown** automatically
- Use `[9] Test All Accounts` to verify which accounts are working
- Use `[7] Check Live Status` for instant status view (no API calls)

---

## 📁 Project Structure

```
shir2/
├── weynshare.js     # Main application
├── accounts.json    # Stored accounts (auto-created)
├── package.json     # Project config
└── README.md        # This file
```
