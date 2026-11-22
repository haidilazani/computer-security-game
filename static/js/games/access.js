/* Gatekeeper Protocol — Chapter 2: Authentication & Access Control */
window.GAME_DEF = {

  tutorial: {
    title: 'Gatekeeper Protocol — Briefing',
    slides: [
      `<p>You are the <span class="hl">Gatekeeper</span> — the reference monitor of this facility. Nobody touches a resource without passing you.</p>
       <p>Every visitor goes through the same three steps, in this exact order:</p>
       <div class="tut-visual">1. IDENTIFY      "Who do you claim to be?"   (username)
2. AUTHENTICATE  "Prove it."                 (password / token / biometric)
3. AUTHORIZE     "Here is what you may do."  (policy grants access)</div>
       <p><span class="hl">Identification</span> is the claim. <span class="hl">Authentication</span> is the proof. Don’t mix them up.</p>`,

      `<p>Proof comes in exactly <span class="hl">three factors</span> — the most important table of the chapter:</p>
       <div class="tut-visual">Something you KNOW  → passwords, passphrases, shared secrets
Something you HAVE  → smart cards, security tokens
Something you ARE   → fingerprints, iris, voice, typing rhythm</div>
       <p>Combine any two and you get <span class="hl">two-factor authentication (2FA)</span> — like a PIN (know) + a token code that changes every 30 seconds (have).</p>`,

      `<p>Passwords are the oldest factor — and the easiest to crack. Know your enemies:</p>
       <ul>
         <li><span class="hl">Brute force</span> — try every combination.</li>
         <li><span class="hl">Dictionary attack</span> — try every word in a wordlist.</li>
         <li><span class="hl">Keylogging</span>, <span class="hl">shoulder surfing</span>, <span class="hl">phishing</span>, <span class="hl">social engineering</span>.</li>
       </ul>
       <p>Defences: store only <span class="hl">one-way hashes</span> (even the admin can’t read your password), lock accounts after failed attempts, show last-login time.</p>`,

      `<p>Once inside, <span class="hl">access control</span> decides who may do what:</p>
       <div class="tut-visual">ACL         → list attached to the OBJECT   "who can access THIS file?"
Capability  → list attached to the SUBJECT  "what can THIS user access?"</div>
       <p>And three ways to run the whole system:</p>
       <div class="tut-visual">DAC  → the OWNER decides          (most common systems)
MAC  → the ADMIN / policy decides (SELinux, military)
RBAC → your ROLE decides          (job function = rights)</div>`,

      `<p><strong>Your shifts (levels)</strong></p>
       <ul>
         <li><span class="hl">L1 — Prove It:</span> sort the three factors, order the login pipeline.</li>
         <li><span class="hl">L2 — Password Under Siege:</span> know the attacks, then forge an uncrackable password in the lab.</li>
         <li><span class="hl">L3 — Gate Decisions:</span> read real ACLs and stamp ALLOW / DENY.</li>
         <li><span class="hl">L4 — Models of Control:</span> DAC vs MAC vs RBAC, Kerberos and biometrics.</li>
       </ul>
       <p>Replay this briefing any time with the <span class="hl">Tutorial</span> button. To your post, Gatekeeper.</p>`,
    ],
  },

  levels: [
    /* ---------------------------------------------------- Level 1 */
    {
      title: 'Prove It',
      desc: 'Identification vs authentication, and the three factors.',
      brief: 'A queue is forming at the gate. First nail the vocabulary, then classify every credential presented to you: KNOW, HAVE or ARE?',
      questions: [
        {
          type: 'mc',
          prompt: 'A visitor walks up and types the username "liza". Which step of the pipeline is this?',
          choices: ['Identification — a claim of identity', 'Authentication — proof of identity', 'Authorization — granting of rights', 'Accountability — logging the action'],
          answer: 0,
          explain: '<strong>Identification</strong> = presenting an identifier so the system can tell you apart from others. No proof has been offered yet.',
        },
        {
          type: 'mc',
          prompt: 'The system now checks that the password matches the account "liza". Which step is THIS?',
          choices: ['Authentication — binding the identity to the subject', 'Identification', 'Authorization', 'Auditing'],
          answer: 0,
          explain: '<strong>Authentication</strong> = verifying the claimed identity by an exchange of information. Identification says WHO; authentication says PROVE IT.',
        },
        {
          type: 'order',
          prompt: 'Arrange the access pipeline in the correct order.',
          items: ['Identify (claim an identity)', 'Authenticate (prove the identity)', 'Authorize (grant access per policy)'],
          explain: 'Identify → Authenticate → Authorize. Only after successful authentication does the system grant privileges according to the policy.',
        },
        {
          type: 'sort',
          tag: 'Credential check',
          prompt: 'A credential is presented. Which authentication factor is it?',
          cats: ['Something you KNOW', 'Something you HAVE', 'Something you ARE'],
          items: [
            { text: 'A password', cat: 'Something you KNOW', explain: 'Passwords are the original "something you know" — most widely used, easiest to crack.' },
            { text: 'A smart card', cat: 'Something you HAVE', explain: 'A physical, tamper-proof credential you possess.' },
            { text: 'A fingerprint', cat: 'Something you ARE', explain: 'A physiological biometric — part of your body.' },
            { text: 'Mother’s maiden name', cat: 'Something you KNOW', explain: 'A shared secret — knowledge, like a password (and often weaker!).' },
            { text: 'A SecurID token generating a new code every 30 s', cat: 'Something you HAVE', explain: 'The hardware token is possessed — its code proves you HAVE it. Add a PIN and you get 2FA.' },
            { text: 'Your voice print', cat: 'Something you ARE', explain: 'A behavioural biometric — a characteristic of you as a person.' },
            { text: 'Your keyboard typing rhythm', cat: 'Something you ARE', explain: 'Keyboard dynamics — behavioural biometrics. Even HOW you type identifies you.' },
            { text: 'A passphrase', cat: 'Something you KNOW', explain: 'A sentence hashed into a password — still knowledge.' },
          ],
        },
        {
          type: 'mc',
          prompt: 'An authentication system must stop attacker C from presenting himself as A to B. Which design objective is that?',
          choices: ['Impersonation prevention', 'Correctness', 'Transferability protection', 'Scalability'],
          answer: 0,
          explain: 'The three objectives: <strong>Correctness</strong> (honest A can authenticate to honest B), <strong>Impersonation prevention</strong> (C can’t pose as A), <strong>Transferability protection</strong> (B can’t replay A’s exchange to impersonate A elsewhere).',
        },
      ],
    },

    /* ---------------------------------------------------- Level 2 */
    {
      title: 'Password Under Siege',
      desc: 'Know the attacks — then forge a password that survives them.',
      brief: 'The SOC is reporting credential attacks on all fronts. Identify each attack technique, then step into the lab and build a password strong enough to outlive the attacker.',
      questions: [
        {
          type: 'match',
          prompt: 'Match each password attack to its method.',
          pairs: [
            ['Brute force', 'Tries every possible combination, exhaustively'],
            ['Dictionary attack', 'Systematically tries every word in a wordlist'],
            ['Keylogging', 'Malware records every keystroke to a log file'],
            ['Shoulder surfing', 'Watches you type, by direct observation'],
            ['Phishing', 'Pretends to be a trusted party to steal credentials'],
            ['Social engineering', 'Manipulates people into giving up secrets'],
          ],
          explain: 'People — not technology — are the biggest source of security problems. Social engineering works terrifyingly well against the tired and inexperienced.',
        },
        {
          type: 'mc',
          prompt: 'How should a system store your password so that even the administrator cannot read it?',
          choices: [
            'As a one-way hash (e.g. salted hash)',
            'Encrypted with the admin’s key',
            'In a hidden file, in plain text',
            'Reversibly encoded in Base64',
          ],
          answer: 0,
          explain: 'Passwords are stored via a <strong>one-way hash function</strong> — the system can only <em>validate</em> a password, never recover it. (This app does exactly that with yours.)',
        },
        {
          type: 'custom',
          units: 3,
          render(card, api) {
            const { h } = api;
            card.append(
              h('p', { class: 'q-type-tag' }, 'The Password Forge'),
              h('p', { class: 'q-prompt' }, 'Forge a password that meets ALL field requirements. Watch the estimated crack time respond as you type.'),
            );
            const reqs = [
              { id: 'len', label: 'At least 12 characters', test: v => v.length >= 12 },
              { id: 'case', label: 'Upper AND lower case letters', test: v => /[A-Z]/.test(v) && /[a-z]/.test(v) },
              { id: 'num', label: 'At least one digit', test: v => /\d/.test(v) },
              { id: 'sym', label: 'At least one symbol', test: v => /[^A-Za-z0-9]/.test(v) },
              { id: 'word', label: 'Must NOT contain "password" or "123456"', test: v => !/password|123456/i.test(v) },
            ];
            const list = h('ul', { style: 'list-style:none;margin:14px 0;display:grid;gap:6px' });
            const marks = {};
            reqs.forEach(r => {
              const li = h('li', { style: 'font-family:var(--mono);font-size:13px;color:var(--muted)' }, '○ ' + r.label);
              marks[r.id] = li;
              list.append(li);
            });
            const input = h('input', { class: 'game-input', type: 'text', placeholder: 'Type your candidate password…', autocomplete: 'off', spellcheck: 'false' });
            const meter = h('div', { class: 'crack-meter' },
              h('div', { class: 'cipher-label' }, 'Estimated time to brute-force (10 billion guesses/sec)'),
              h('div', { class: 'crack-time', id: 'crackTime' }, '—'),
              h('div', { class: 'crack-detail', id: 'crackDetail' }, 'Charset × length = key space. Longer beats fancier.'),
            );
            const submit = h('button', { class: 'btn btn-primary', disabled: true }, 'Deploy password');
            card.append(input, list, meter, h('div', { class: 'widget-actions' }, submit));

            function crackTime(v) {
              let charset = 0;
              if (/[a-z]/.test(v)) charset += 26;
              if (/[A-Z]/.test(v)) charset += 26;
              if (/\d/.test(v)) charset += 10;
              if (/[^A-Za-z0-9]/.test(v)) charset += 33;
              if (!charset) return { secs: 0, charset: 0 };
              return { secs: Math.pow(charset, v.length) / 2 / 1e10, charset };
            }
            function fmt(secs) {
              if (secs < 1) return '< 1 second';
              const units = [[31557600 * 1e9, 'billion years'], [31557600 * 1e6, 'million years'], [31557600 * 1000, 'thousand years'], [31557600, 'years'], [86400, 'days'], [3600, 'hours'], [60, 'minutes'], [1, 'seconds']];
              for (const [s, name] of units) {
                if (secs >= s) return `${Math.round(secs / s * 10) / 10} ${name}`;
              }
              return '< 1 second';
            }
            input.addEventListener('input', () => {
              const v = input.value;
              let allOk = true;
              reqs.forEach(r => {
                const ok = r.test(v);
                marks[r.id].textContent = (ok ? '✓ ' : '○ ') + r.label;
                marks[r.id].style.color = ok ? 'var(--green)' : 'var(--muted)';
                if (!ok) allOk = false;
              });
              const { secs, charset } = crackTime(v);
              const t = card.querySelector('#crackTime');
              t.textContent = v ? fmt(secs) : '—';
              t.style.color = secs > 3e9 ? 'var(--green)' : secs > 3600 * 24 * 30 ? 'var(--amber)' : 'var(--red)';
              card.querySelector('#crackDetail').textContent =
                v ? `charset ≈ ${charset} symbols · length ${v.length} → key space ${charset}^${v.length}` : 'Charset × length = key space. Longer beats fancier.';
              submit.disabled = !allOk;
            });
            submit.onclick = () => {
              input.disabled = true; submit.disabled = true;
              api.correct(3);
              api.feedback(true,
                'Every character class you add grows the <strong>charset</strong>; every extra character multiplies the whole key space again. That’s why <strong>long + mixed</strong> beats short + clever — and why brute force gives up. (Don’t reuse this one anywhere, agent.)',
                api.next);
            };
          },
        },
        {
          type: 'mc',
          prompt: 'The system locks an account after 5 failed login attempts. Which attacks does this measure blunt the most?',
          choices: ['Brute force and guessing', 'Shoulder surfing', 'Keylogging', 'Phishing'],
          answer: 0,
          explain: 'De-activation after repeated failures caps how many guesses an online attacker gets — brute force and guessing need <em>volume</em>. Keylogging and phishing steal the real password in one go.',
        },
        {
          type: 'mc',
          prompt: 'Your bank login shows: "Last login: yesterday 23:41". You were asleep then. Why do systems display this?',
          choices: [
            'So users themselves can DETECT unauthorised use of their account',
            'To prove the server is online',
            'It is required by the CIA triad',
            'To make brute force slower',
          ],
          answer: 0,
          explain: 'Displaying time of last login is a classic password security measure — it recruits <strong>you</strong> as the detection mechanism.',
        },
      ],
    },

    /* ---------------------------------------------------- Level 3 */
    {
      title: 'Gate Decisions',
      desc: 'Read the ACL. Stamp ALLOW or DENY. No mistakes.',
      brief: 'Requests are queuing at your gate, each with the object’s ACL attached. Apply the list exactly as written — and remember which structure is attached to what.',
      questions: [
        {
          type: 'decision', tag: 'ACL check',
          prompt: 'Apply the ACL. Allow or deny?',
          scenario: 'OBJECT: payroll.xlsx\nACL: { alice: read, write } { bob: read } { interns(group): — }\n\nREQUEST: bob → WRITE payroll.xlsx',
          answer: 'deny',
          explain: 'The ACL grants bob <strong>read only</strong>. Fail-safe defaults: anything not explicitly granted is denied.',
        },
        {
          type: 'decision', tag: 'ACL check',
          prompt: 'Apply the ACL. Allow or deny?',
          scenario: 'OBJECT: lecture_notes.pdf\nACL: { staff(group): read, write } { students(group): read }\nFACT: maria is a member of group "students"\n\nREQUEST: maria → READ lecture_notes.pdf',
          answer: 'allow',
          explain: 'Groups are an access-control abstraction: maria inherits READ from her group membership. Easy sharing, easy adding/removing of users.',
        },
        {
          type: 'decision', tag: 'ACL check',
          prompt: 'Careful — there is a negative permission. Allow or deny?',
          scenario: 'OBJECT: exam_answers.docx\nACL: { staff(group): read } { NEGATIVE dave: read }\nFACT: dave is a member of group "staff"\n\nREQUEST: dave → READ exam_answers.docx',
          answer: 'deny',
          explain: 'A <strong>negative permission</strong> is an explicit revocation — it overrides what the group grants. Dave is staff, but dave is specifically denied.',
        },
        {
          type: 'mc',
          prompt: '"Who can access THIS file?" — which structure answers that question directly?',
          choices: [
            'An ACL — a list attached to the object',
            'A capability — a list attached to the subject',
            'The access control matrix row for a user',
            'A protection ring',
          ],
          answer: 0,
          explain: '<strong>ACL = object-centred</strong> (a column of the matrix). <strong>Capability = subject-centred</strong> (a row: "what can THIS user access?"). Classic exam contrast.',
        },
        {
          type: 'mc',
          prompt: 'Which structure makes it EASY to see everything one user can access, but HARD to revoke a single object’s permissions?',
          choices: ['Capabilities', 'ACLs', 'The reference monitor', 'Negative permissions'],
          answer: 0,
          explain: 'Capabilities travel with the subject: great overview per user, easy transfer/inheritance — but poor per-object overview and difficult revocation.',
        },
        {
          type: 'match',
          prompt: 'Match the access-control vocabulary.',
          pairs: [
            ['Subject', 'Active entity that initiates an access request'],
            ['Object', 'Passive resource to which access is requested'],
            ['Rights', 'The types of access — read, write, execute…'],
            ['Reference monitor', 'Mechanism that makes the authorization decisions'],
          ],
          explain: 'Nuance: subjects act on behalf of <em>principals</em> (principal = user ID, subject = process ID) — and a resource can be object or subject depending on the request.',
        },
        {
          type: 'mc',
          prompt: 'A reference monitor must satisfy three core requirements. Which option lists them?',
          choices: [
            'Tamper-resistance · complete mediation · easy verification',
            'Speed · scalability · transparency',
            'Confidentiality · integrity · availability',
            'Prevention · detection · reaction',
          ],
          answer: 0,
          explain: 'It cannot be altered, it is ALWAYS invoked (every access checked), and it is small enough to verify and test.',
        },
      ],
    },

    /* ---------------------------------------------------- Level 4 */
    {
      title: 'Models of Control',
      desc: 'DAC, MAC or RBAC? Plus Kerberos and biometrics.',
      brief: 'Final shift: who decides access in each system you inspect? Then walk a user through Kerberos, and calibrate the biometric scanners.',
      questions: [
        {
          type: 'sort',
          tag: 'Who decides?',
          prompt: 'DAC, MAC or RBAC — which model is at work?',
          cats: ['DAC', 'MAC', 'RBAC'],
          items: [
            { text: 'The file’s OWNER shares it with a colleague', cat: 'DAC', explain: '<strong>Discretionary</strong>: access control is carried out by the resource owner. Used in most common systems.' },
            { text: 'SELinux enforces one system-wide policy fixed by the admin', cat: 'MAC', explain: '<strong>Mandatory</strong>: centralized control, rights fixed by an administrator. Strict info-flow control, but cumbersome.' },
            { text: 'A new hire instantly gets all "Accountant" permissions', cat: 'RBAC', explain: '<strong>Role-based</strong>: your job function carries the rights. Users get only what their role needs.' },
            { text: 'You attach rights to your own holiday photos', cat: 'DAC', explain: 'Ownership is associated with principals — the owner decides. That’s DAC.' },
            { text: 'A lecturer creates a role "Student" with right: read course material', cat: 'RBAC', explain: 'The lecturer example from the notes — procedures grouped into roles, roles assigned to users.' },
            { text: 'Military system: no owner may loosen the central classification policy', cat: 'MAC', explain: 'Policy is system-wide and mandatory — individual owners have no discretion.' },
          ],
        },
        {
          type: 'order',
          prompt: 'Walk a user through Kerberos — put the flow in order.',
          items: [
            'User logs in; hash of password becomes the secret key',
            'Client asks the Authentication Server (AS)',
            'AS returns a Ticket-Granting Ticket (TGT)',
            'Client presents TGT to the Ticket-Granting Server (TGS)',
            'TGS issues a service ticket',
            'Client presents the service ticket to the service',
          ],
          explain: 'Log in once → TGT from the AS → service tickets from the TGS → access each service. Passwords are <strong>never sent in clear text</strong>.',
        },
        {
          type: 'mc',
          prompt: 'SecurID: you enter a PIN plus the code from a hardware token that changes every 30 seconds. Which two factors is that?',
          choices: [
            'Something you KNOW + something you HAVE',
            'Something you KNOW + something you ARE',
            'Something you HAVE + something you ARE',
            'Two different things you KNOW',
          ],
          answer: 0,
          explain: 'PIN = knowledge; token = possession. 2FA = a combination of any two authentication modes (patented back in 1984!). Clock sync with the server is required.',
        },
        {
          type: 'match',
          prompt: 'Calibrate the biometric scanners — match each term.',
          pairs: [
            ['FAR (False Acceptance Rate)', 'Impostor wrongly ACCEPTED'],
            ['FRR (False Rejection Rate)', 'Genuine user wrongly REJECTED'],
            ['FTE (Failure To Enrol)', 'User cannot be enrolled at all'],
            ['Liveness detection', 'Checks the sample comes from a live person'],
          ],
          explain: 'High FTE plagues retinal scans; liveness detection stops fingerprint spoofing. Remember: biometrics can’t be revoked — you can’t reissue your fingerprint.',
        },
        {
          type: 'mc',
          prompt: 'Biometrics are called the hardest factor to forge. What is their most fundamental drawback?',
          choices: [
            'They cannot be revoked or reissued if compromised',
            'They are always slower than passwords',
            'They only work for administrators',
            'They require an internet connection',
          ],
          answer: 0,
          explain: 'Impossibility of revocation: leak a password → reset it; leak your fingerprint → it’s compromised <em>forever</em>. Plus non-zero error rates, cost and privacy issues.',
        },
        {
          type: 'mc',
          prompt: 'Log in once — access ALL connected systems without further passwords. This property is called:',
          choices: ['Single Sign-On (SSO)', 'Two-factor authentication', 'Password synchronization', 'Complete mediation'],
          answer: 0,
          explain: '<strong>SSO</strong> across related but independent systems. Kerberos and Active Directory are classic client-server SSO solutions.',
        },
      ],
    },
  ],
};
