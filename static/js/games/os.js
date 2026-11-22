/* Permission Terminal — Chapter 4: Operating System Security */
(function () {
  'use strict';

  /* ------------------------------------------------ rwx bit-builder widget */
  const BIT_ROUNDS = [
    { desc: 'Owner: read+write+execute · Group: read+execute · Others: none', octal: '750' },
    { desc: 'Owner: read+write · Group: read · Others: read', octal: '644' },
    { desc: 'Owner: full access · Group: none · Others: none', octal: '700' },
  ];

  function bitBuilder(card, api) {
    const { h } = api;
    let round = 0;

    card.append(
      h('p', { class: 'q-type-tag' }, 'Bit builder'),
      h('p', { class: 'q-prompt' }, 'Set the mode bits to match the requested permissions. r=4, w=2, x=1.'),
    );
    const target = h('div', { class: 'q-scenario' });
    const widget = h('div', { class: 'perm-widget' });
    const submit = h('button', { class: 'btn btn-primary' }, 'Apply mode');
    card.append(target, widget, h('div', { class: 'widget-actions' }, submit));

    const who = ['owner', 'group', 'others'];
    const bits = ['r', 'w', 'x'];
    let state;

    function build() {
      state = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      widget.innerHTML = '';
      target.textContent = `TASK ${round + 1}/${BIT_ROUNDS.length}\n${BIT_ROUNDS[round].desc}`;
      who.forEach((w, wi) => {
        const row = h('div', { class: 'perm-row' }, h('span', { class: 'perm-who' }, w));
        bits.forEach((b, bi) => {
          const btn = h('button', { class: 'perm-bit' }, b);
          btn.onclick = () => {
            state[wi][bi] = state[wi][bi] ? 0 : 1;
            btn.classList.toggle('on', !!state[wi][bi]);
            refreshOctal(row, wi);
          };
          row.append(btn);
        });
        row.append(h('span', { class: 'perm-octal', 'data-who': wi }, '0'));
        widget.append(row);
      });
    }

    function refreshOctal(row, wi) {
      const v = state[wi][0] * 4 + state[wi][1] * 2 + state[wi][2];
      row.querySelector('.perm-octal').textContent = String(v);
    }

    function current() {
      return state.map(r => r[0] * 4 + r[1] * 2 + r[2]).join('');
    }

    submit.onclick = () => {
      const want = BIT_ROUNDS[round].octal;
      const got = current();
      const ok = got === want;
      if (ok) api.correct(1); else api.wrong(1);
      submit.disabled = true;
      const rwx = want.split('').map(d => {
        const n = parseInt(d, 10);
        return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      }).join('');
      api.feedback(ok,
        (ok ? `Mode <strong>${want}</strong> (${rwx}) applied.`
            : `You set <strong>${got}</strong>, but the task needed <strong>${want}</strong> (${rwx}).`) +
        ' Remember: each digit is r(4)+w(2)+x(1) for owner, group, others.',
        () => {
          card.querySelector('.feedback').remove();
          submit.disabled = false;
          round++;
          if (round < BIT_ROUNDS.length) build();
          else api.next();
        });
    };

    build();
  }

  /* ------------------------------------------------ chmod terminal widget */
  const TERM_TASKS = [
    { file: 'report.txt', want: '750', desc: 'owner: rwx · group: r-x · others: none' },
    { file: 'secrets.db', want: '600', desc: 'owner: rw- · group: none · others: none' },
    { file: 'deploy.sh', want: '755', desc: 'owner: rwx · group: r-x · others: r-x' },
  ];

  function chmodTerminal(card, api) {
    const { h, esc } = api;
    let task = 0;
    let missed = false;

    card.append(
      h('p', { class: 'q-type-tag' }, 'Live terminal'),
      h('p', { class: 'q-prompt' }, 'Use chmod with an OCTAL mode to set the requested permissions on each file.'),
    );

    const out = h('div', { class: 'term-out' });
    const input = h('input', { type: 'text', placeholder: 'type a command…', autocomplete: 'off', spellcheck: 'false' });
    const term = h('div', { class: 'term' },
      h('div', { class: 'term-bar' }, h('i'), h('i'), h('i'), h('span', {}, 'agent@cyberquest: ~/files')),
      out,
      h('div', { class: 'term-in' }, h('span', {}, '$'), input),
    );
    card.append(term);

    function print(html, cls) {
      const line = h('div');
      line.innerHTML = cls ? `<span class="${cls}">${html}</span>` : html;
      out.append(line);
      out.scrollTop = out.scrollHeight;
    }

    function rwxOf(octal) {
      return octal.split('').map(d => {
        const n = parseInt(d, 10);
        return (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      }).join('');
    }

    function showTask() {
      missed = false;
      print(`<span class="t-acc">TASK ${task + 1}/${TERM_TASKS.length}</span> — set <span class="t-acc">${TERM_TASKS[task].file}</span> to: ${TERM_TASKS[task].desc}`);
      print(`hint: chmod &lt;octal&gt; ${TERM_TASKS[task].file}`, 't-muted');
    }

    function handle(cmdRaw) {
      const cmd = cmdRaw.trim().replace(/\s+/g, ' ');
      print(`$ ${esc(cmdRaw)}`, 't-muted');
      if (!cmd) return;

      const t = TERM_TASKS[task];
      const m = cmd.match(/^chmod\s+([0-7]{3})\s+(\S+)$/);

      if (cmd === 'help') {
        print('commands: chmod <octal> <file> · ls -l · help', 't-muted');
        return;
      }
      if (cmd === 'ls -l' || cmd === 'ls') {
        TERM_TASKS.forEach((x, i) =>
          print(`-${i < task ? rwxOf(x.want) : 'rw-r--r--'}  1 agent agent  4096 ${x.file}`));
        return;
      }
      if (!m) {
        print(`sh: unrecognised command — try: chmod 640 file.txt (or "help")`, 't-err');
        return;
      }
      const [, mode, file] = m;
      if (file !== t.file) {
        print(`chmod: cannot access '${esc(file)}': not today's task (need ${t.file})`, 't-err');
        return;
      }
      if (mode !== t.want) {
        if (!missed) { missed = true; api.wrong(1); }
        print(`applied ${mode} → -${rwxOf(mode)}  …but the task wanted: ${t.desc}. Try again.`, 't-err');
        return;
      }
      if (!missed) api.correct(1);
      print(`applied ${mode} → -${rwxOf(mode)}  ${t.file}   ✓ correct`, );
      task++;
      if (task < TERM_TASKS.length) showTask();
      else {
        print('All permissions set. Session closed.', 't-acc');
        input.disabled = true;
        api.feedback(true,
          'chmod sets the mode bits; chown changes the owner. You just did what every sysadmin does daily — octal in muscle memory.',
          api.next);
      }
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { handle(input.value); input.value = ''; }
    });

    print('CyberQuest secure shell — type "help" for commands', 't-muted');
    showTask();
    setTimeout(() => input.focus(), 50);
  }

  /* ================================================================= */
  window.GAME_DEF = {

    tutorial: {
      title: 'Permission Terminal — Briefing',
      slides: [
        `<p>Two operating systems, one problem: <span class="hl">who may do what?</span> This mission runs you through how Unix and Windows each solve it.</p>
         <p>On Unix, every file carries a <span class="hl">mode</span>: three permissions × three classes of user:</p>
         <div class="tut-visual">        owner  group  others
         rwx    r-x    r--
r = read (4) · w = write (2) · x = execute (1)

rwx r-x r--  →  7 5 4  →  chmod 754 file</div>`,

        `<p>Unix identity is a number: <span class="hl">UID</span> (user) and <span class="hl">GID</span> (group), stored in <span class="hl">/etc/passwd</span> — 7 colon-separated fields:</p>
         <div class="tut-visual">root:x:0:0:root:/root:/bin/bash
 │   │ │ │  │    │        └ login shell
 │   │ │ │  │    └ home directory
 │   │ │ │  └ comment / full name
 │   │ │ └ GID     │
 │   │ └ UID       │
 │   └ 'x' = encrypted password lives in /etc/shadow
 └ username</div>
         <p>The superuser <span class="hl">root is whoever has UID 0</span> — the NAME doesn’t matter. Any account with UID 0 is all-powerful. Keep that in mind, detective.</p>`,

        `<p>Special bits give Unix its sharpest edges:</p>
         <ul>
           <li><span class="hl">SUID</span> — program runs with the <em>file owner’s</em> effective UID (how <code>passwd</code> runs as root).</li>
           <li><span class="hl">SGID</span> — runs with the file’s group.</li>
           <li><span class="hl">Sticky bit</span> — in shared dirs like /tmp, only a file’s owner may delete it.</li>
         </ul>
         <p>A buggy SUID-root program is a classic path to <span class="hl">privilege escalation</span> — keep them few, small, careful.</p>`,

        `<p>Windows plays the same game with richer machinery:</p>
         <div class="tut-visual">Principal → SID  (S-1-5-21-<domain>-500 = Administrator)
Process   → token (user SID + group SIDs + privileges)
Object    → security descriptor:
            Owner · Group · DACL (grants/denies) · SACL (audit)</div>
         <p>The <span class="hl">DACL</span> is a list of ACEs processed <span class="hl">strictly in order</span>: matching DENY stops everything; matching ALLOWs accumulate until the request is satisfied. No DACL at all? Access granted!</p>`,

        `<p><strong>Terminal schedule</strong></p>
         <ul>
           <li><span class="hl">L1 — Bit Builder:</span> forge modes with the 9-bit switchboard.</li>
           <li><span class="hl">L2 — chmod Terminal:</span> a live shell. Type real commands.</li>
           <li><span class="hl">L3 — Root Detective:</span> read /etc/passwd, find the intruder.</li>
           <li><span class="hl">L4 — Windows Watchtower:</span> SIDs, tokens and the ACE algorithm.</li>
         </ul>
         <p>Briefing available anytime via the <span class="hl">Tutorial</span> button.</p>`,
      ],
    },

    levels: [
      /* ---------------------------------------------------- Level 1 */
      {
        title: 'Bit Builder',
        desc: 'Flip the 9 bits. Match the octal. r=4, w=2, x=1.',
        brief: 'Three files arrive needing exact permissions. Toggle the rwx switchboard until the octal matches the spec — then prove you can convert in your head.',
        questions: [
          { type: 'custom', units: 3, render: bitBuilder },
          {
            type: 'mc',
            prompt: 'Convert: what is  rwxr-xr--  in octal?',
            choices: ['754', '745', '654', '764'],
            answer: 0,
            explain: 'Owner rwx = 4+2+1 = <strong>7</strong> · group r-x = 4+0+1 = <strong>5</strong> · others r-- = <strong>4</strong> → 754.',
          },
          {
            type: 'mc',
            prompt: 'Convert back: what does mode 640 look like?',
            choices: ['rw-r-----', 'rw----r--', 'rwxr-----', 'r--rw----'],
            answer: 0,
            explain: '6 = rw- · 4 = r-- · 0 = --- → owner reads and writes, group reads, others get nothing.',
          },
          {
            type: 'mc',
            prompt: 'Your webserver needs everyone to READ pages, but only you to CHANGE them. Which mode for index.html?',
            choices: ['644', '600', '777', '755'],
            answer: 0,
            explain: '644 = rw-r--r--: owner edits, everyone reads, nobody else writes. (777 — everything for everyone — is how security incidents start.)',
          },
        ],
      },

      /* ---------------------------------------------------- Level 2 */
      {
        title: 'chmod Terminal',
        desc: 'A live shell. Type real chmod commands to secure real files.',
        brief: 'You have shell access. Three files need locking down — type actual chmod commands with octal modes. Then answer the ops questions about directories and defaults.',
        questions: [
          { type: 'custom', units: 3, render: chmodTerminal },
          {
            type: 'mc',
            prompt: 'On a DIRECTORY, what does the write (w) permission actually allow?',
            choices: [
              'Creating and deleting files inside the directory',
              'Editing the text of every file inside',
              'Listing the directory contents',
              'Making the directory your current directory',
            ],
            answer: 0,
            explain: 'Directory permissions mean different things: read = list (ls), <strong>write = create/delete entries</strong>, execute = enter (cd) and open files within.',
          },
          {
            type: 'mc',
            prompt: 'A user can `cd` into a directory but `ls` shows "permission denied". Which bits does the directory have for them?',
            choices: ['Execute but not read', 'Read but not execute', 'Write only', 'No bits at all'],
            answer: 0,
            explain: 'Execute lets you <em>enter</em> and open files you already know by name; read is what lets you <em>list</em>. x-without-r gives exactly this behaviour.',
          },
          {
            type: 'mc',
            prompt: 'What does umask do?',
            choices: [
              'Removes permission bits from newly created files by default',
              'Encrypts new files automatically',
              'Hides files from other users',
              'Sets the owner of new files',
            ],
            answer: 0,
            explain: 'The <strong>umask</strong> is a mask that strips bits from the default permissions of new files — controlling how "open" files are born.',
          },
          {
            type: 'mc',
            prompt: 'Mounting an untrusted USB drive — which mount options reduce the risk?',
            choices: [
              'nosuid, noexec, nodev, ro',
              'rw, exec, suid',
              'sync and async together',
              'Just format it first',
            ],
            answer: 0,
            explain: 'Secure mounting: <strong>nosuid</strong> (ignore SUID bits), <strong>noexec</strong> (no executables), <strong>nodev</strong> (no device files), <strong>ro</strong> (read-only).',
          },
        ],
      },

      /* ---------------------------------------------------- Level 3 */
      {
        title: 'Root Detective',
        desc: 'Someone hid a backdoor account in /etc/passwd. Find it.',
        brief: 'A compromised server lands on your desk. Its /etc/passwd is displayed in each exhibit. Read the fields like a detective — one account is not what it seems.',
        questions: [
          {
            type: 'mc',
            prompt: 'Study this /etc/passwd. Which account is a hidden BACKDOOR with root privileges?',
            scenario: 'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nlaskov:x:1001:100:Pavel Laskov:/home/laskov:/bin/bash\nfunnybunny:x:0:101:Just a bunny:/home/bunny:/bin/bash\nwebapp:x:33:33:www data:/var/www:/usr/sbin/nologin',
            choices: ['funnybunny', 'laskov', 'webapp', 'daemon'],
            answer: 0,
            explain: 'Look at field 3: funnybunny has <strong>UID 0</strong>. Any account with UID 0 IS root — the username is irrelevant. Classic backdoor.',
          },
          {
            type: 'mc',
            prompt: 'In `laskov:x:1001:100:…` — what does the "x" in the second field mean?',
            choices: [
              'The encrypted password is stored in /etc/shadow',
              'The account is eXpired',
              'The password is the letter x',
              'The account cannot log in',
            ],
            answer: 0,
            explain: '/etc/passwd is world-readable, so real password hashes moved to the protected <strong>/etc/shadow</strong> file — "x" is the pointer.',
          },
          {
            type: 'match',
            prompt: 'Match each /etc/passwd field to its meaning.',
            pairs: [
              ['Field 1 (laskov)', 'Username used at login'],
              ['Field 3 (1001)', 'UID — 0 means root'],
              ['Field 4 (100)', 'GID — the primary group'],
              ['Field 6 (/home/laskov)', 'Home directory at login'],
              ['Field 7 (/bin/bash)', 'Login shell'],
            ],
            explain: 'Seven colon-separated fields. Field 5 (skipped here) is the comment/full-name field.',
          },
          {
            type: 'mc',
            prompt: 'The ordinary user command `passwd` can edit root-owned password files. HOW?',
            choices: [
              'The passwd binary has the SUID bit — it runs with root’s effective UID',
              'All users secretly have root access',
              '/etc/shadow is world-writable',
              'It sends a request to Microsoft',
            ],
            answer: 0,
            explain: '<strong>SUID = controlled invocation</strong>: the process takes the effective UID of the file’s OWNER (root), not the user who ran it. Power, tightly channelled.',
          },
          {
            type: 'decision', tag: 'Risk call',
            prompt: 'Audit finding: a large, home-grown SUID-root program parses user input and trusts $PATH. Ship it to production?',
            allowLabel: '✓ SHIP IT', denyLabel: '✕ BLOCK IT',
            answer: 'deny',
            explain: 'A buggy SUID-root program (buffer overflow, attacker-controlled search path…) hands out <strong>root</strong>. Keep SUID programs few, small and carefully written — this one is none of those.',
          },
          {
            type: 'mc',
            prompt: '/tmp is shared by everyone, yet users cannot delete each other’s files. Which bit makes that work?',
            choices: ['The sticky bit', 'SUID', 'SGID', 'The umask'],
            answer: 0,
            explain: 'The <strong>sticky bit</strong> on a shared directory means only a file’s owner may delete or rename their own files.',
          },
          {
            type: 'mc',
            prompt: 'Root "cannot" write to a read-only filesystem and "cannot" decrypt passwords. Why are the quotes there?',
            choices: [
              'Root can simply remount the filesystem writable, and reset (not decrypt) any password',
              'Because root actually has no restrictions at all',
              'Because the filesystem will crash',
              'Because passwords are stored in plain text anyway',
            ],
            answer: 0,
            explain: 'Root’s few restrictions are all bypassable: remount rw, reset passwords instead of decrypting. Almost every access-control check is simply <strong>off</strong> for UID 0.',
          },
        ],
      },

      /* ---------------------------------------------------- Level 4 */
      {
        title: 'Windows Watchtower',
        desc: 'SIDs, tokens, and the ACE matching algorithm — run it by hand.',
        brief: 'Cross-training on the Windows tower. Identify the security components, then sit in the Security Reference Monitor’s chair and process real DACLs, ACE by ACE, in order.',
        questions: [
          {
            type: 'match',
            prompt: 'Match each Windows security component to its job.',
            pairs: [
              ['Winlogon', 'Handles the user log-on process'],
              ['LSA (Local Security Authority)', 'Password verification, access tokens, audit logs'],
              ['SAM (Security Accounts Manager)', 'The accounts database, stores password encryption'],
              ['UAC (User Account Control)', 'Enforces limited user privileges (since Vista)'],
              ['Security Reference Monitor', 'Kernel-mode ACL verification — the access decisions'],
            ],
            explain: 'Four live in user mode; the Security Reference Monitor decides access from <strong>kernel mode</strong>. (The MS04-11 buffer overflow in the LSA enabled the Sasser worm.)',
          },
          {
            type: 'mc',
            prompt: 'You find the SID  S-1-5-21-<domain>-500  in a token. Who is that?',
            choices: ['The domain Administrator', 'The Everyone group', 'The System account', 'A random guest'],
            answer: 0,
            explain: 'Relative ID <strong>500 = Administrator</strong>. Compare: Everyone = S-1-1-0, System = S-1-5-18. Format: S-1-IA-SA…-N.',
          },
          {
            type: 'mc',
            prompt: '"Permission to shut down the system or format a disk" — in Windows terms, is that a privilege or an access right?',
            choices: [
              'A privilege — permission to DO an operation',
              'An access right — permission to ACCESS an object',
              'A SID',
              'An ACE',
            ],
            answer: 0,
            explain: 'Common exam trap! <strong>Privileges</strong> = permission to perform operations (format disk, reset passwords, shut down). <strong>Access rights</strong> = permission to access objects (files, keys…).',
          },
          {
            type: 'decision', tag: 'ACE algorithm',
            prompt: 'Run the ACE matching algorithm. Grant or deny?',
            scenario: 'OBJECT: budget.xlsx — has NO DACL at all\n\nREQUEST: guest_user → READ budget.xlsx',
            allowLabel: '✓ GRANT', denyLabel: '✕ DENY',
            answer: 'allow',
            explain: 'Rule zero of the algorithm: an object with <strong>no DACL grants everyone access</strong>. (An <em>empty</em> DACL is the opposite — it denies all. Subtle and dangerous.)',
          },
          {
            type: 'decision', tag: 'ACE algorithm',
            prompt: 'Process the ACEs strictly in order. Grant or deny?',
            scenario: 'OBJECT: audit.log\nDACL (in order):\n  ACE1: DENY  bob   read\n  ACE2: ALLOW staff read     (bob ∈ staff)\n\nREQUEST: bob → READ audit.log',
            allowLabel: '✓ GRANT', denyLabel: '✕ DENY',
            answer: 'deny',
            explain: 'ACE1 matches bob’s SID with a <strong>negative permission → DENY and STOP</strong>. The later ALLOW is never reached. Order is everything.',
          },
          {
            type: 'decision', tag: 'ACE algorithm',
            prompt: 'Same DACL, ACEs swapped. Grant or deny?',
            scenario: 'OBJECT: audit.log\nDACL (in order):\n  ACE1: ALLOW staff read     (bob ∈ staff)\n  ACE2: DENY  bob   read\n\nREQUEST: bob → READ audit.log',
            allowLabel: '✓ GRANT', denyLabel: '✕ DENY',
            answer: 'allow',
            explain: 'ACE1 already grants ALL requested rights → <strong>GRANT and stop</strong>. ACE2 is never evaluated. Same entries, opposite outcome — this is why admins put DENY ACEs first.',
          },
          {
            type: 'decision', tag: 'ACE algorithm',
            prompt: 'Rights accumulate across ACEs. Grant or deny?',
            scenario: 'OBJECT: report.docx\nDACL (in order):\n  ACE1: ALLOW alice read\n  ACE2: ALLOW alice write\n\nREQUEST: alice → READ + WRITE report.docx',
            allowLabel: '✓ GRANT', denyLabel: '✕ DENY',
            answer: 'allow',
            explain: 'ACE1 grants read (not yet enough — continue), ACE2 adds write → accumulated rights now satisfy the whole request → <strong>GRANT</strong>.',
          },
          {
            type: 'match',
            prompt: 'Match the parts of a Windows security descriptor.',
            pairs: [
              ['Owner', 'The principal who owns the object'],
              ['DACL', 'Who is granted and who is denied access'],
              ['SACL', 'The security AUDIT policy'],
              ['Primary group', 'Kept for POSIX compatibility'],
            ],
            explain: 'Every securable object carries a security descriptor. DACL = access decisions; SACL = what gets audited (the Windows answer to “who watches?”).',
          },
        ],
      },
    ],
  };
})();
