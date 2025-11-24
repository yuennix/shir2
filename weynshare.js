

const https = require('https');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let globalStopFlag = false;

const C = (c, t) => `\x1b[${c}m${t}\x1b[0m`;
const green = (t) => C('92', t);
const red = (t) => C('91', t);
const yellow = (t) => C('93', t);
const cyan = (t) => C('96', t);
const magenta = (t) => C('95', t);
const blue = (t) => C('94', t);
const white = (t) => C('97', t);
const reset = (t) => C('0', t);


function displayASCIIBanner() {
  console.log(C('38;5;201', '  ██████╗  ██████╗  ██████╗ ███████╗████████╗    ███████╗██╗  ██╗'));
  console.log(C('38;5;165', '  ██╔══██╗██╔═══██╗██╔═══██╗██╔════╝╚══██╔══╝    ██╔════╝██║  ██║'));
  console.log(C('38;5;129', '  ██████╔╝██║   ██║██║   ██║███████╗   ██║       ███████╗███████║'));
  console.log(C('38;5;93', '  ██╔══██╗██║   ██║██║   ██║╚════██║   ██║       ╚════██║██╔══██║'));
  console.log(C('38;5;57', '  ██████╔╝╚██████╔╝╚██████╔╝███████║   ██║       ███████║██║  ██║'));
  console.log(C('38;5;21', '  ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝       ╚══════╝╚═╝  ╚═╝'));
  console.log('');
}


function printAnimatedBanner() {
  console.clear();
  process.stdout.write('\x1b[3J');
  process.stdout.write('\x1b[H\x1b[2J');

  console.log('\n');

  setTimeout(() => {
    displayASCIIBanner();

    const accounts = (() => {
      try {
        if (fs.existsSync(ACCOUNTS_FILE)) {
          return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
        }
      } catch {}
      return [];
    })();
    const accountCount = accounts.length;

    console.log(C('38;5;46', '   ✨ ') + C('38;5;82', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ') + C('38;5;46', '✨'));
    console.log(C('38;5;51', '                          STORED ACCOUNTS: ') + C('38;5;45', String(accountCount)));
    console.log(C('38;5;46', '     ✨ ') + C('38;5;82', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ') + C('38;5;46', '✨'));
    console.log('');

    setTimeout(() => {
      startMain();
    }, 1200);
  }, 300);
}

const ACCOUNTS_FILE = 'accounts.json';

class AccountManager {
  static loadAccounts() {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      try {
        const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
        const accounts = JSON.parse(data);
        return accounts.filter(acc => acc.cookie && acc.cookie.includes('c_user='));
      } catch (e) {
        console.error('Error loading accounts:', e.message);
        return [];
      }
    }
    return [];
  }

  static saveAccounts(accounts) {
    try {
      const validAccounts = accounts.filter(acc => acc && acc.cookie && acc.cookie.includes('c_user='));
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(validAccounts, null, 2));
    } catch (e) {
      console.error('Error saving accounts:', e.message);
    }
  }

  static async addAccount() {
    try {
      const accounts = this.loadAccounts();
      console.log(yellow('\n[+] ➕ Add Facebook Accounts'));
      console.log(cyan('📝 Choose mode:'));
      console.log(magenta('  [1] Single account (add 1 cookie)'));
      console.log(magenta('  [2] Bulk import (add multiple cookies)'));

      const mode = await ask(cyan('\nSelect mode (1/2) - Press (b) to go back: '));
      console.clear();

      if (mode === '2') {
        return await this.bulkAddAccounts(accounts);
      } else {
        return await this.singleAddAccount(accounts);
      }
    } catch (e) {
      if (e.message === 'BACK') {
        console.clear();
        return false;
      }
      if (e.message === 'STOP') {
        console.log(red('\n⏹️ Stopping...'));
        return false;
      }
      throw e;
    }
  }

  static async singleAddAccount(accounts) {
    try {
      console.log(yellow('[+] ➕ Add New Facebook Account'));
      console.log(cyan('📝 Input Facebook Cookie (c_user, xs, datr):'));
      console.log(magenta('💡 Tip: Copy complete cookie from Facebook'));

      const cookie = await ask(cyan('\nCookie (Press b to go back): '));
      console.clear();
      if (!cookie.includes('c_user=') || !cookie.includes('xs=')) {
        console.log(red('❌ Invalid cookie! Please ensure it contains c_user= and xs='));
        return false;
      }

      const accountId = Date.now();
      const cUserMatch = cookie.match(/c_user=(\d+)/);
      const uid = cUserMatch ? cUserMatch[1] : String(accountId);
      const account = {
        id: accountId,
        uid: uid,
        cookie: cookie,
        added: new Date().toISOString(),
        status: 'active',
        shareCount: 0,
        successRate: '100%',
        lastShare: null,
        cooldown: false,
        cooldownUntil: null
      };

      accounts.push(account);
      this.saveAccounts(accounts);
      console.log(green(`✅ Account added successfully! UID: ${uid}`));
      console.log(blue(`🎉 Ready for mass sharing!`));
      return true;
    } catch (e) {
      if (e.message === 'BACK' || e.message === 'STOP') {
        console.clear();
        return false;
      }
      throw e;
    }
  }

  static async bulkAddAccounts(accounts) {
    try {
      console.log(yellow('[+] 📦 Bulk Import Accounts'));
      console.log(cyan('📝 Paste cookies (one per line, comma-separated values or full cookies):'));
      console.log(magenta('💡 Tips:'));
      console.log(magenta('  - Press Enter twice to finish'));
      console.log(magenta('  - Each line = 1 cookie'));
      console.log(magenta('  - Cookies must have c_user= and xs='));

      let input = '';
      let emptyLines = 0;

      while (emptyLines < 2) {
        const line = await ask(cyan('\nCookie (Press b to go back): '));
        if (line.trim() === '') {
          emptyLines++;
          continue;
        }
        emptyLines = 0;
        input += line + '\n';
      }

      console.clear();
      const cookies = input.trim().split('\n').filter(c => c.trim().length > 0);

      if (cookies.length === 0) {
        console.log(red('❌ No valid cookies provided!'));
        return false;
      }

      console.log(yellow(`\n[+] 🔄 Processing ${cookies.length} cookies...\n`));

      const results = [];
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        process.stdout.write(cyan(`  Processing [${i + 1}/${cookies.length}]... `));

        if (!cookie.includes('c_user=') || !cookie.includes('xs=')) {
          console.log(red('❌ SKIPPED - Invalid format'));
          results.push({ status: 'skipped', error: 'Invalid format' });
          continue;
        }

        const accountId = Date.now() + i;
        const cUserMatch = cookie.match(/c_user=(\d+)/);
        const uid = cUserMatch ? cUserMatch[1] : String(accountId);

        const account = {
          id: accountId,
          uid: uid,
          cookie: cookie,
          added: new Date().toISOString(),
          status: 'active',
          shareCount: 0,
          successRate: '100%',
          lastShare: null,
          cooldown: false,
          cooldownUntil: null
        };

        accounts.push(account);
        console.log(green(`✅ SUCCESS (UID: ${uid})`));
        results.push({ status: 'success', uid });

        await new Promise(r => setTimeout(r, 300));
      }

      this.saveAccounts(accounts);

      const success = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const skipped = results.filter(r => r.status === 'skipped').length;

      console.log(magenta('\n════════════════════════════════════════════════════════════════'));
      console.log(magenta('                      BULK IMPORT REPORT                       '));
      console.log(magenta('════════════════════════════════════════════════════════════════'));
      console.log(green(`  ✅ SUCCESSFUL:  ${success}`.padEnd(60)));
      console.log(red(`  ❌ FAILED:      ${failed}`.padEnd(60)));
      console.log(yellow(`  ⊘ SKIPPED:     ${skipped}`.padEnd(60)));
      console.log(blue(`  📊 TOTAL:      ${cookies.length}`.padEnd(60)));
      console.log(magenta('════════════════════════════════════════════════════════════════\n'));

      return success > 0;
    } catch (e) {
      if (e.message === 'BACK' || e.message === 'STOP') {
        console.clear();
        return false;
      }
      throw e;
    }
  }

static listAccounts() {
  const accounts = this.loadAccounts();

  if (accounts.length === 0) {
    console.log(red('\n════════════════════════════════════════════════════════════════════════'));
    console.log(red('                     NO ACCOUNTS FOUND                     '));
    console.log(red('════════════════════════════════════════════════════════════════════════'));
    console.log(yellow('  Use option [1] to add your first account'));
    console.log(yellow('  Ready to add UNLIMITED Facebook accounts!'));
    console.log(red('════════════════════════════════════════════════════════════════════════\n'));
    return [];
  }

  console.log(magenta('\n════════════════════════════════════════════════════════════════════════'));
  console.log(magenta('                       REGISTERED ACCOUNTS                       '));
  console.log(magenta('════════════════════════════════════════════════════════════════════════'));
  console.log(cyan('  #   ACCOUNT ID       STATUS     SHARES   SUCCESS   ADDED DATE'));
  console.log(cyan('  ──────────────────────────────────────────────────────────────────────'));

  accounts.forEach((acc, i) => {
    const status = acc.status === 'active' ? green('A') : red('I');
    const shares = String(acc.shareCount).padEnd(4);
    const idShort = acc.id.toString().substring(0, 6);
    
    console.log(cyan(` ${String(i + 1).padEnd(2)}[${idShort}] ${status} ${shares}`));
  });

  console.log(cyan('  ─────────────────────────'));

  const activeCount = accounts.filter(a => a.status === 'active').length;
  const totalShares = accounts.reduce((sum, a) => sum + a.shareCount, 0);

  console.log(cyan('\n SUMMARY:'));
  console.log(blue  (` Total: ${accounts.length}`));
  console.log(green (` Active: ${activeCount}`));
  console.log(red   (` Inactive: ${accounts.length - activeCount}`));
  console.log(yellow(` Shares: ${totalShares}`));

  console.log(magenta('═════════════════════════════\n'));

  return accounts;
}
  static async removeAccount() {
    try {
      const accounts = this.listAccounts();
      if (accounts.length === 0) return;

      const inputPrompt = cyan('\n[+] Select account to remove (number): ');
      const indexInput = await ask(inputPrompt);
      console.clear();
      const index = parseInt(indexInput) - 1;

      if (index < 0 || index >= accounts.length) {
        console.log(red('❌ Invalid selection!'));
        return;
      }

      const removed = accounts.splice(index, 1)[0];
      this.saveAccounts(accounts);
      console.log(green(`✅ Account ${removed.id} removed successfully!`));
    } catch (e) {
      if (e.message === 'BACK' || e.message === 'STOP') {
        console.clear();
        return;
      }
      throw e;
    }
  }

  static async toggleAccountStatus() {
    try {
      const accounts = this.listAccounts();
      if (accounts.length === 0) return;

      const inputPrompt = cyan('\n[+] Select account to toggle (number, b=back): ');
      const indexInput = await ask(inputPrompt);
      console.clear();
      const index = parseInt(indexInput) - 1;

      if (index < 0 || index >= accounts.length) {
        console.log(red('❌ Invalid selection!'));
        return;
      }

      accounts[index].status = accounts[index].status === 'active' ? 'inactive' : 'active';
      this.saveAccounts(accounts);
      const status = accounts[index].status === 'active' ? green('ACTIVE') : red('INACTIVE');
      console.log(green(`✅ Account ${accounts[index].id} is now ${status}`));
    } catch (e) {
      if (e.message === 'BACK' || e.message === 'STOP') {
        console.clear();
        return;
      }
      throw e;
    }
  }
}

function ask(q) {
  return new Promise((r, reject) => {
    rl.line = '';
    rl._refreshLine();
    rl.question(q, ans => {
      rl.line = '';
      rl._refreshLine();
      if (ans.toLowerCase() === 'b') {
        reject(new Error('BACK'));
      } else if (ans.toLowerCase() === 's') {
        globalStopFlag = true;
        reject(new Error('STOP'));
      } else {
        r(ans);
      }
    });
  });
}

async function getToken(cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'business.facebook.com',
      path: '/business_locations',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
        'Referer': 'https://www.facebook.com/',
        'Cookie': cookie,
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const match = data.match(/EAAG\w+/);
        match ? resolve(match[0]) : reject(new Error('Invalid cookie'));
      });
    });
    req.on('error', () => reject(new Error('Network error')));
    req.end();
  });
}

async function shareOnce(cookie, url, accountId = null, retryCount = 0) {
  return new Promise(async (resolve) => {
    try {
      let token;
      try {
        token = await getToken(cookie);
      } catch (e) {
        return resolve({ success: false, error: 'Cannot extract token from cookie', accountId });
      }

      const data = JSON.stringify({ 
        link: url,
        published: 0,
        privacy: { value: 'SELF' }
      });
      const options = {
        hostname: 'graph.facebook.com',
        path: `/v20.0/me/feed?access_token=${token}`,
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'User-Agent': 'Mozilla/5.0', 
          'Cookie': cookie 
        }
      };

      const req = https.request(options, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.id) {
              resolve({ success: true, id: json.id.split('_')[1] || json.id, accountId });
            } else if (json.error) {
              const errorMsg = json.error?.message || JSON.stringify(json.error);
              const errorEn = errorMsg
                .replace(/Nililimitahan namin/g, 'we limit how often')
                .replace(/gaano kadalas/g, 'frequency')
                .replace(/nang gamitin ang/g, '')
                .replace(/\[.*?\]/g, '')
                .trim();

              const lowerMsg = errorEn.toLowerCase();
              const isRateLimit = lowerMsg.includes('we limit') || lowerMsg.includes('rate limit') || lowerMsg.includes('too frequent') || lowerMsg.includes('frequency') || json.error?.code === 17;
              const isDisabled = lowerMsg.includes('unless you login') || lowerMsg.includes('until you login to');

              if (isRateLimit && retryCount < 2) {
                const backoffDelay = (retryCount + 1) * 1000 + Math.random() * 500;
                setTimeout(() => {
                  shareOnce(cookie, url, accountId, retryCount + 1).then(resolve);
                }, backoffDelay);
              } else {
                resolve({ success: false, error: errorEn || errorMsg, accountId, isRateLimit, isDisabled });
              }
            } else {
              resolve({ success: false, error: 'Unknown error', accountId });
            }
          } catch (e) {
            resolve({ success: false, error: 'Parse error', accountId });
          }
        });
      });
      req.on('error', () => {
        resolve({ success: false, error: 'Network error', accountId });
      });
      req.write(data); 
      req.end();
    } catch (e) {
      resolve({ success: false, error: 'Request error', accountId });
    }
  });
}

class ProgressTracker {
  constructor(totalShares, activeAccounts) {
    this.totalShares = totalShares;
    this.completed = 0;
    this.success = 0;
    this.failed = 0;
    this.globalCounter = 0;
    this.accountStats = new Map();
    this.activeAccounts = activeAccounts;
    this.startTime = Date.now();
    this.updateInterval = null;
    this.lastShareInfo = null;

    activeAccounts.forEach(acc => {
      this.accountStats.set(acc.id, { completed: 0, success: 0, failed: 0 });
    });
  }

  recordResult(uid, isSuccess, postId, shareCounter, totalAccountShares, errorMsg = '') {
    this.completed++;
    this.globalCounter++;
    if (isSuccess) {
      this.success++;
    } else {
      this.failed++;
    }

    this.render(uid, isSuccess, postId, shareCounter, totalAccountShares, errorMsg);
  }

  startRendering() {
  }

  stopRendering() {
  }

  render(uid, isSuccess, postId, shareCounter, totalAccountShares, errorMsg = '') {
    const statusText = isSuccess ? green('✅ SUCCESS') : red('❌ FAILED');
    const errorDisplay = errorMsg ? red(` [${errorMsg.substring(0, 35)}]`) : '';

    console.log(
      cyan(`[${String(this.globalCounter).padStart(4)}] `) +
      red(`[SHARER] `) +
      blue(`${uid}_${postId} `) +
      magenta(`${shareCounter}/${totalAccountShares} `) +
      `---> ${statusText}${errorDisplay}`
    );
  }

  getFinalStats() {
    const durationSeconds = (Date.now() - this.startTime) / 1000;
    return {
      totalShares: this.totalShares,
      completed: this.completed,
      success: this.success,
      failed: this.failed,
      duration: durationSeconds,
      durationFormatted: durationSeconds.toFixed(1)
    };
  }
}

async function runAccountShares(account, postUrl, sharesPerAccount, tracker, statsLock) {
  const concurrency = 10;
  const sharePromises = [];
  let stopAccount = false;

  for (let i = 1; i <= sharesPerAccount; i++) {
    if (globalStopFlag || stopAccount) break;

    const sharePromise = (async (shareNumber) => {
      const result = await shareOnce(account.cookie, postUrl, account.id, 0);

      await statsLock(async () => {
        if (result.success) {
          account.shareCount++;
          account.lastShare = new Date().toISOString();
          tracker.recordResult(account.uid, true, result.id, shareNumber, sharesPerAccount);
        } else {
          tracker.recordResult(account.uid, false, 'ERROR', shareNumber, sharesPerAccount, result.error || 'Unknown');
          if (result.isRateLimit) {
            account.cooldown = true;
            account.cooldownUntil = new Date(Date.now() + 1800000).toISOString();
            stopAccount = true;
          }
          if (result.isDisabled) {
            account.status = 'disabled';
            account.cooldown = false;
            stopAccount = true;
          }
        }
      });
    })(i);

    sharePromises.push(sharePromise);

    if (sharePromises.length >= concurrency) {
      await Promise.race(sharePromises);
      sharePromises.splice(0, 1);
    }
  }

  await Promise.all(sharePromises);
}

async function massShare() {
  try {
    const accounts = AccountManager.loadAccounts();
    const now = new Date();
    const activeAccounts = accounts.filter(acc => {
      if (acc.status !== 'active') return false;
      if (!acc.uid && acc.cookie) {
        const cUserMatch = acc.cookie.match(/c_user=(\d+)/);
        acc.uid = cUserMatch ? cUserMatch[1] : String(acc.id);
      }
      if (acc.cooldown && acc.cooldownUntil) {
        const cooldownUntil = new Date(acc.cooldownUntil);
        if (now < cooldownUntil) return false;
        acc.cooldown = false;
        acc.cooldownUntil = null;
      }
      return true;
    });

    if (activeAccounts.length === 0) {
      console.log(red('\n❌ No active accounts found!'));
      console.log(yellow('💡 Add accounts first or activate existing ones'));
      return;
    }

    const postUrl = (await ask(cyan('\n[+] 🌐 Enter Post URL to share (b=back): '))).trim();
    console.clear();
    const sharesPerAccountInput = (await ask(cyan('[+] 🔢 Amount of shares per account (1-4000, b=back): '))).trim();
    console.clear();
    const sharesPerAccount = parseInt(sharesPerAccountInput);

    if (isNaN(sharesPerAccount) || sharesPerAccount < 1 || sharesPerAccount > 4000) {
      console.log(red('❌ Invalid shares! Must be between 1-4000'));
      return;
    }

    const totalShares = activeAccounts.length * sharesPerAccount;

    console.log(yellow(`\n[+] 🚀 FAST Mass Share Configuration:`));
    console.log(cyan(`   📱 Active Accounts: ${activeAccounts.length}`));
    console.log(cyan(`   🔢 Shares per account: ${sharesPerAccount}`));
    console.log(cyan(`   📊 Total shares: ${totalShares}`));
    console.log(green(`   ⚡ Speed: OPTIMIZED (600-800 shares/minute per account)`));
    console.log(magenta(`   💥 ESTIMATED TIME: ~${((totalShares * 50) / 1000).toFixed(0)} seconds`));

    const confirm = (await ask(cyan('\n[+] ❓ Start sharing? (y/N, b=back): '))).trim();
    if (confirm.toLowerCase() !== 'y') {
      console.log(yellow('❌ Operation cancelled.'));
      return;
    }

    const tracker = new ProgressTracker(totalShares, activeAccounts);
    let statsQueue = Promise.resolve();
    const statsLock = (fn) => {
      statsQueue = statsQueue.then(fn);
      return statsQueue;
    };

    console.log(yellow('\n🚀 Starting FAST SHARING...\n'));
    console.log(magenta('⚡ Processing ${totalShares} shares at maximum speed!\n'));

    tracker.startRendering();

    try {
      await Promise.all(
        activeAccounts.map(account => 
          runAccountShares(account, postUrl, sharesPerAccount, tracker, statsLock)
        )
      );
    } finally {
      tracker.stopRendering();
    }

    const finalStats = tracker.getFinalStats();
    AccountManager.saveAccounts(accounts);

    console.log('\n');
    console.log(magenta('\n═════════════════════════════════════════════════════════════════════════'));
    console.log(magenta('            🚀 FAST SHARING COMPLETED! 🚀            '));
    console.log(magenta('═════════════════════════════════════════════════════════════════════════'));
    console.log(green(`  TOTAL SUCCESS:     ${finalStats.success}`.padEnd(60)));
    console.log(red(`  TOTAL FAILED:      ${finalStats.failed}`.padEnd(60)));
    const successRate = finalStats.success + finalStats.failed > 0 
      ? ((finalStats.success / (finalStats.success + finalStats.failed)) * 100).toFixed(1) 
      : 0;
    console.log(yellow(`  SUCCESS RATE:      ${successRate}%`.padEnd(60)));
    console.log(blue(`  DURATION:          ${finalStats.durationFormatted}s (${(finalStats.duration/60).toFixed(1)} min)`.padEnd(60)));
    const sharesPerSec = finalStats.duration > 0 ? (finalStats.success / finalStats.duration).toFixed(1) : 'N/A';
    console.log(magenta(`  SPEED:             ${sharesPerSec} shares/second`.padEnd(60)));
    console.log(cyan(`  ACCOUNTS USED:     ${activeAccounts.length}`.padEnd(60)));
    console.log(magenta('═════════════════════════════════════════════════════════════════════════'));
    console.log(C('38;5;51', '  ⚡ FAST MODE COMPLETE! ⚡'));
    console.log(C('38;5;45', '  Thank you for using BOOST-SH v1.1!'));
    console.log(magenta('═════════════════════════════════════════════════════════════════════════\n'));
  } catch (e) {
    if (e.message === 'BACK') {
      console.clear();
      return;
    }
    if (e.message === 'STOP') {
      console.clear();
      return;
    }
    throw e;
  }
}

async function checkAccountLive(token, cookie) {
  return new Promise(resolve => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v20.0/me?fields=id,name&access_token=${token}`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cookie': cookie }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.id && json.name) {
            resolve({ alive: true, name: json.name });
          } else if (json.error) {
            resolve({ alive: false, error: json.error.message });
          } else {
            resolve({ alive: false, error: 'Unknown error' });
          }
        } catch {
          resolve({ alive: false, error: 'Parse error' });
        }
      });
    });
    req.on('error', () => resolve({ alive: false, error: 'Connection failed' }));
    req.end();
  });
}

async function checkAllAccountsLive() {
  try {
    const accounts = AccountManager.loadAccounts();
    if (accounts.length === 0) {
      console.log(red('\n❌ No accounts to check!'));
      return;
    }

    const results = [];
    const now = new Date();
    for (const account of accounts) {
      let result;
      if (account.cooldown && new Date(account.cooldownUntil) > now) {
        result = { alive: true, name: 'Rate Limited (Cooldown)', isCooldown: true };
      } else {
        result = await checkAccountLive(account.token, account.cookie);
        result.isCooldown = false;
      }
      results.push({ ...account, ...result });
    }

    console.log(magenta('\n═════════════════════════════════════════════════════════════════════════'));
    console.log(magenta('                       ACCOUNT LIVE STATUS REPORT                      '));
    console.log(magenta('═════════════════════════════════════════════════════════════════════════'));

    const aliveCount = results.filter(r => r.alive && !r.isCooldown).length;
    const deadCount = results.filter(r => !r.alive).length;
    const cooldownCount = results.filter(r => r.isCooldown).length;

    console.log(green(`  ✅ ALIVE ACCOUNTS:      ${aliveCount}`.padEnd(60)));
    console.log(red(`  ❌ DISABLED ACCOUNTS:   ${deadCount}`.padEnd(60)));
    console.log(yellow(`  🔴 COOLDOWN ACCOUNTS:   ${cooldownCount}`.padEnd(60)));
    console.log(cyan(`  📊 TOTAL ACCOUNTS:     ${results.length}`.padEnd(60)));

    console.log(magenta('\n  DETAILED RESULTS:'));
    console.log(magenta('  ─────────────────────────────────────────────────────────────'));

    results.forEach((result, i) => {
      let status, statusDisplay;
      if (result.isCooldown) {
        status = yellow('🔴 COOLDOWN');
        const timeRemaining = new Date(result.cooldownUntil) - now;
        const minutes = Math.ceil(timeRemaining / 60000);
        statusDisplay = `${minutes}min remaining`;
      } else if (result.alive) {
        status = green('✅ ACTIVE');
        statusDisplay = result.name;
      } else {
        status = red('❌ DISABLED');
        statusDisplay = result.error;
      }
      console.log(cyan(`  ${String(i + 1).padEnd(2)}. ${String(result.id).substring(0, 12)}... ${status} - ${statusDisplay}`.padEnd(70)));
    });

    console.log(magenta('═════════════════════════════════════════════════════════════════════════\n'));

    if (deadCount > 0) {
      const confirm = await ask(cyan('[+] ❓ Remove disabled accounts? (y/N, b=back): '));
      console.clear();
      if (confirm.toLowerCase() === 'y') {
        const filtered = accounts.filter(acc => {
          const result = results.find(r => r.id === acc.id);
          return result && (result.alive || result.isCooldown);
        });
        AccountManager.saveAccounts(filtered);
        console.log(green(`✅ Removed ${deadCount} disabled accounts!`));
      }
    }
  } catch (e) {
    if (e.message === 'BACK' || e.message === 'STOP') {
      console.clear();
      return;
    }
    throw e;
  }
}

async function singleShare() {
  try {
    const accounts = AccountManager.listAccounts();
    if (accounts.length === 0) return;

    const indexInput = await ask(cyan('\n[+] Select account (number, b=back): '));
    console.clear();
    const index = parseInt(indexInput) - 1;
    if (index < 0 || index >= accounts.length) {
      console.log(red('❌ Invalid selection!'));
      return;
    }

    const account = accounts[index];
    if (account.status !== 'active') {
      console.log(red(`❌ Account ${account.id} is inactive!`));
      return;
    }

    const postUrl = await ask(cyan('[+] 🌐 Enter Post URL to share (b=back): '));
    console.clear();
    const sharesInput = await ask(cyan('[+] 🔢 Number of shares (1-4000, b=back): '));
    console.clear();
    const shares = parseInt(sharesInput);

    if (isNaN(shares) || shares < 1 || shares > 4000) {
      console.log(red('❌ Invalid number! Must be between 1-4000'));
      return;
    }

    console.log(yellow(`\n[+] 🚀 Starting ${shares} shares with Account ${index + 1}...`));
    console.log(cyan(`   📱 Account ID: ${account.id}`));
    console.log(cyan(`   🔗 URL: ${postUrl}\n`));

    let success = 0;

    for (let i = 1; i <= shares; i++) {
      if (globalStopFlag) {
        console.log(red('\n\n⏹️ SHARING STOPPED BY USER'));
        break;
      }
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      const res = await shareOnce(account.token, account.cookie, postUrl);
      if (res.success) {
        console.log(green(`✅ SUCCESS ${i}/${shares} | ID: ${res.id}`)); 
        success++;
        account.shareCount++;
        account.lastShare = new Date().toISOString();
      } else {
        console.log(red(`❌ FAILED ${i}/${shares} | ${res.error}`));
      }
    }

    AccountManager.saveAccounts(accounts);

  console.log(cyan('\n═════════════════════════════════════════════════════════════════════════'));
  console.log(cyan('                     SINGLE SHARE COMPLETED!                     '));
  console.log(cyan('═════════════════════════════════════════════════════════════════════════'));
  console.log(green(`  SUCCESSFUL SHARES: \( {success}/ \){shares}`.padEnd(60)));
  console.log(cyan(`  SUCCESS RATE:      ${((success/shares)*100).toFixed(1)}%`.padEnd(60)));
  console.log(blue(`  ACCOUNT USED:      ${account.id}`.padEnd(60)));
  console.log(yellow(`  POST URL:          ${postUrl.substring(0, 50)}...`.padEnd(60)));
  console.log(cyan('═════════════════════════════════════════════════════════════════════════'));
  console.log(C('38;5;51', '  Thank you for using BOOST-SH v1.1!'));
  console.log(cyan('═════════════════════════════════════════════════════════════════════════\n'));
  } catch (e) {
    if (e.message === 'BACK' || e.message === 'STOP') {
      console.clear();
      return;
    }
    throw e;
  }
}

function clearScreen() {
  return new Promise(resolve => {
    console.clear();
    process.stdout.write('\x1b[3J\x1b[H\x1b[2J');
    setTimeout(() => resolve(), 50);
  });
}

function getAnimatedMenuTitle() {
  const titleColors = ['38;5;51', '38;5;45', '38;5;39', '38;5;33', '38;5;201', '38;5;165', '38;5;129', '38;5;93'];
  const menuTitle = '🚀 BOOST-SH v1.1 MAIN MENU 🚀';
  let colorIndex = 0;
  let result = '';

  for (let i = 0; i < menuTitle.length; i++) {
    const char = menuTitle[i];
    const color = titleColors[colorIndex % titleColors.length];
    result += C(color, char);
    colorIndex++;
  }

  return result;
}

async function showMenu() {
  const accounts = AccountManager.loadAccounts();
  const cooldownCount = accounts.filter(acc => acc.cooldown).length;
  const cooldownDisplay = cooldownCount > 0 ? magenta(`🔴${cooldownCount}`) : '';

  console.log(C('38;5;201', '\n┌──────────────────────────┐'));
  console.log(C('38;5;201', '│ ') + C('38;5;51', 'BOOST-SH v1.1 MENU') + C('38;5;201', '      │'));
  console.log(C('38;5;201', '├──────────────────────────┤'));

  console.log(C('38;5;51', '│ [1] Add Account          │'));
  console.log(C('38;5;45', '│ [2] List Accounts        │'));
  console.log(C('38;5;39', '│ [3] Remove Account       │'));
  console.log(C('38;5;33', '│ [4] Single Share         │'));
  console.log(C('38;5;226', '│ [5] Mass Share (4K)      │'));
  console.log(C('38;5;208', '│ [6] Statistics           │'));
  console.log(C('38;5;129', '│ [7] Check Live Status    │'));
  console.log(C('38;5;93', '│ [8] Cooldown ' + cooldownDisplay.padEnd(11) + '│'));
  console.log(C('38;5;57', '│ [9] Test All Accounts    │'));

  console.log(C('38;5;201', '├──────────────────────────┤'));
  console.log(C('38;5;226', '│ ⚡ ULTRA FAST SHARING  │'));
  console.log(C('38;5;201', '└──────────────────────────┘'));
}

async function testAllAccounts() {
  try {
    let accounts = AccountManager.loadAccounts();
    if (!accounts || accounts.length === 0) {
      console.log(red('\n❌ No accounts to test!'));
      return;
    }

    console.clear();
    console.log(yellow('\n🧪 TESTING ALL ACCOUNTS (1 Share Each)...\n'));
    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      if (!acc || !acc.cookie) continue;

      // Skip accounts in cooldown
      if (acc.cooldown) {
        console.log(yellow(`   Testing Account ${String(i + 1).padStart(2)}/${accounts.length}... 🔴 COOLDOWN (SKIPPED)`));
        results.push({ uid: acc.uid, status: 'cooldown', statusText: yellow('COOLDOWN') });
        continue;
      }

      process.stdout.write(cyan(`   Testing Account ${String(i + 1).padStart(2)}/${accounts.length}... `));

      const result = await shareOnce(acc.cookie, 'https://www.facebook.com', acc.id, 0);

      let status, icon, statusText;

      if (result.success) {
        status = 'working';
        icon = green('✅');
        statusText = green('WORKING');
        acc.status = 'active';
        acc.shareCount++;
        acc.lastShare = new Date().toISOString();
        console.log(green('✅ WORKING'));
      } else {
        const errorMsg = (result.error || '').toLowerCase();

        if (errorMsg.includes('unless you login') || errorMsg.includes('until you login to')) {
          status = 'disabled';
          icon = red('🚫');
          statusText = red('DISABLED');
          acc.status = 'disabled';
          console.log(red(`🚫 DISABLED (${result.error})`));
        } else if (errorMsg.includes('we limit') || errorMsg.includes('rate limit') || errorMsg.includes('too frequent') || errorMsg.includes('frequency') || errorMsg.includes('limit how often')) {
          status = 'limited';
          icon = yellow('🔴');
          statusText = yellow('LIMITED');
          acc.cooldown = true;
          acc.cooldownUntil = new Date(Date.now() + 1800000).toISOString();
          console.log(yellow(`🔴 LIMITED (${result.error})`));
        } else {
          status = 'error';
          icon = red('❌');
          statusText = red(`ERROR: ${result.error}`);
          console.log(red(`❌ ERROR: ${result.error}`));
        }
      }

      results.push({ uid: acc.uid, status, statusText: statusText });
      await new Promise(r => setTimeout(r, 100));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    AccountManager.saveAccounts(accounts);

    console.log(magenta('\n TEST REPORT'));
    console.log(magenta('──────────────────────────'));

    const workingCount = results.filter(r => r.status === 'working').length;
    const disabledCount = results.filter(r => r.status === 'disabled').length;
    const limitedCount = results.filter(r => r.status === 'limited').length;
    const cooldownCount = results.filter(r => r.status === 'cooldown').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(green(`✅ Working: ${workingCount}`));
    console.log(red(`🚫 Disabled: ${disabledCount}`));
    console.log(yellow(`🔴 Limited: ${limitedCount}`));
    console.log(yellow(`⏸️ Cooldown: ${cooldownCount}`));
    console.log(red(`❌ Error: ${errorCount}`));
    console.log(blue(`Total: ${results.length}`));
    console.log(cyan(`Time: ${duration}s`));

    console.log(magenta('\n DETAILS:'));
    results.forEach((r, i) => {
      let icon;
      if (r.status === 'working') icon = green('✅');
      else if (r.status === 'disabled') icon = red('🚫');
      else if (r.status === 'limited') icon = yellow('🔴');
      else if (r.status === 'cooldown') icon = yellow('⏸️');
      else icon = red('❌');
      console.log(cyan(`${String(i + 1)}. ${icon}`));
    });

    console.log(magenta('══════════════════════════\n'));
  } catch (e) {
    if (e.message === 'BACK' || e.message === 'STOP') {
      console.clear();
      return;
    }
    console.log(red(`\n❌ Error: ${e.message}`));
  }
}

async function showCooldownAccounts() {
  const accounts = AccountManager.loadAccounts();
  const cooldownAccounts = accounts.filter(acc => acc.cooldown);
  const now = new Date();

  if (cooldownAccounts.length === 0) {
    console.log(red('\n┌─────────────────────────┐'));
    console.log(red('│ ✅ NO COOLDOWN ✅       │'));
    console.log(green('│ Ready to share!         │'));
    console.log(red('└─────────────────────────┘'));
    return;
  }

  console.log(magenta('\n COOLDOWN REPORT'));
  console.log(magenta(`Total: ${cooldownAccounts.length}`));
  console.log(magenta('──────────────────────────'));

  cooldownAccounts.forEach((acc, i) => {
    const cooldownUntil = new Date(acc.cooldownUntil);
    const timeRemaining = cooldownUntil - now;
    let timeText = '';

    if (timeRemaining <= 0) {
      timeText = red('READY');
    } else {
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      timeText = yellow(`${minutes}m${seconds}s`);
    }

    const idShort = String(acc.id).substring(0, 4);
    console.log(cyan(`${String(i + 1)}. [${idShort}] ${timeText}`));
  });

  console.log(magenta('══════════════════════════\n'));
}

async function showStats() {
  const accounts = AccountManager.loadAccounts();
  if (accounts.length === 0) {
    console.log(red('\n┌──────────────────────────┐'));
    console.log(red('│ ❌ NO STATS YET ❌       │'));
    console.log(yellow('│ Add accounts first       │'));
    console.log(red('└──────────────────────────┘'));
    return;
  }

  const totalShares = accounts.reduce((sum, acc) => sum + acc.shareCount, 0);
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
  const totalAccounts = accounts.length;

  console.log(magenta('\n STATISTICS'));
  console.log(magenta('──────────────────────────'));
  console.log(blue(`Total: ${totalAccounts}`));
  console.log(green(`Active: ${activeAccounts}`));
  console.log(red(`Inactive: ${totalAccounts - activeAccounts}`));
  console.log(yellow(`Shares: ${totalShares}`));

  if (totalShares > 0) {
    console.log(cyan(`Avg: ${(totalShares / totalAccounts).toFixed(1)}`));
  }

  console.log(magenta('\n ACCOUNTS:'));
  accounts.forEach((acc, i) => {
    const statusColor = acc.status === 'active' ? green('A') : red('I');
    const idShort = String(acc.id).substring(0, 5);
    console.log(cyan(`${String(i + 1)}. [${idShort}] ${statusColor} ${acc.shareCount}s`));
  });

  console.log(magenta('══════════════════════════\n'));
}

async function main() {
  console.clear();
  console.log('\n');
  displayASCIIBanner();
  while (true) {
    try {
      await showMenu();
      const choice = await ask(cyan('\n[+] Select option (0-9, b=back): '));

      switch (choice.toLowerCase()) {
        case '1':
          await AccountManager.addAccount();
          break;
        case '2':
          AccountManager.listAccounts();
          break;
        case '3':
          await AccountManager.removeAccount();
          break;
        case '4':
          await singleShare();
          break;
        case '5':
          await massShare();
          break;
        case '6':
          await showStats();
          break;
        case '7':
          await checkAllAccountsLive();
          break;
        case '8':
          await showCooldownAccounts();
          break;
        case '9':
          await testAllAccounts();
          break;
        case '0':
        case 'exit':
          console.log(C('38;5;51', '\n👋 Thank you for using BOOST-SH v1.1!'));
          console.log(C('38;5;165', '💖 Made by Jhames Martin'));
          console.log(C('38;5;129', '🌟 Termux Ready • PH Edition 2025'));
          console.log(C('38;5;226', '🚀 Happy sharing! See you next time!'));
          rl.close();
          return;
        default:
          console.log(red('\n❌ Invalid option! Please select 0-9.'));
      }

      try {
        await ask(cyan('\n[+] Press Enter to continue (b=back)...'));
      } catch (e) {
        if (e.message === 'BACK' || e.message === 'STOP') {
          console.clear();
          console.log('\n');
          displayASCIIBanner();
          continue;
        }
      }
    } catch (e) {
      if (e.message === 'BACK' || e.message === 'STOP') {
        console.clear();
        console.log('\n');
        displayASCIIBanner();
        continue;
      }
      throw e;
    }

    console.clear();
    console.log('\n');
    displayASCIIBanner();
  }
}

function startMain() { 
  main().catch(e => { 
    console.log(red(`\n❌ Critical Error: ${e.message}`)); 
    console.log(yellow('💡 Try running with --debug for more details'));
    process.exit(1); 
  }); 
}


if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log(C('38;5;51', 'BOOST-SH v1.1 - Multi Account Edition'));
  console.log(C('38;5;165', 'Made by Jhames Martin - PH Edition 2025'));
  process.exit(0);
}

printAnimatedBanner();
