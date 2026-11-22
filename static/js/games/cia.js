/* CIA Command Center — Chapter 1: Fundamentals of Computer Security */
window.GAME_DEF = {

  tutorial: {
    title: 'CIA Command Center — Briefing',
    slides: [
      `<p>Welcome, agent. You've just been posted to the <span class="hl">CSC662 Command Center</span> as its new security officer.</p>
       <p><strong>Security = protection of assets</strong> — devices, software, data, know-how, even reputation. Your tools fall into three jobs:</p>
       <div class="tut-visual">PREVENTION  → stop attacks before they happen
DETECTION   → notice when prevention failed
REACTION    → respond, learn, update defences</div>
       <p>No prevention is perfect — a good system needs all three.</p>`,

      `<p>Your compass on every call is the <span class="hl">CIA Triad</span> — the most famous model in security. Whenever anything happens, ask: <em>which of C, I or A is under attack?</em></p>
       <div class="tut-visual">CONFIDENTIALITY → no unauthorised READING   (secrecy)
INTEGRITY       → no unauthorised CHANGING  (correctness)
AVAILABILITY    → no unauthorised BLOCKING  (uptime)</div>
       <p>Memory hook: <span class="hl">DoS attacks the A in CIA</span>. And beyond CIA there are four extras: authentication, authorization, accountability, non-repudiation.</p>`,

      `<p>Don't mix up the three key words of threat intelligence:</p>
       <ul>
         <li><span class="hl">Vulnerability</span> — an identified <em>weakness</em> in a system.</li>
         <li><span class="hl">Threat</span> — the <em>danger</em>: an entity that could violate security.</li>
         <li><span class="hl">Attack</span> — the <em>act</em> that exploits a vulnerability.</li>
       </ul>
       <div class="tut-visual">threat (danger) + vulnerability (weak spot) = attack (what happens)</div>
       <p>Threat classes map to the CIA service that counters them — Disclosure → Confidentiality, Deception & Disruption → Integrity, Usurpation → Availability.</p>`,

      `<p>At higher levels you'll enforce the <span class="hl">8 design principles</span> (Saltzer &amp; Schroeder, 1975) — least privilege, fail-safe defaults, economy of mechanism, complete mediation, open design, separation of privilege, least common mechanism, psychological acceptability.</p>
       <p>And you'll run <span class="hl">clearance control</span> with the classic security models:</p>
       <div class="tut-visual">Bell-LaPadula (confidentiality): NO READ UP, NO WRITE DOWN
Biba (integrity):  the mirror — NO READ DOWN, NO WRITE UP</div>`,

      `<p><strong>How to play</strong></p>
       <ul>
         <li>4 levels, unlocked in order. Each is a run of interactive challenges.</li>
         <li>Answer correctly to earn points and build a 🔥 streak.</li>
         <li>Finish a level to earn up to <span class="hl">3 stars</span> and 300 XP — accuracy decides.</li>
         <li>Every answer comes with an explanation — that's where the learning happens.</li>
       </ul>
       <p>Need this briefing again? Hit the <span class="hl">Tutorial</span> button, top-right, any time. Good luck, agent.</p>`,
    ],
  },

  levels: [
    /* ---------------------------------------------------- Level 1 */
    {
      title: 'Triad Triage',
      desc: 'Incidents are flooding in. Classify each one: C, I or A?',
      brief: 'Incident reports are hitting your console. For each, decide which security objective is under attack: Confidentiality, Integrity or Availability. Then handle a few follow-up calls.',
      questions: [
        {
          type: 'sort',
          tag: 'Incident triage',
          prompt: 'Which part of the CIA triad is under attack?',
          cats: ['Confidentiality', 'Integrity', 'Availability'],
          items: [
            { text: 'Attacker floods your web server — customers cannot reach it', cat: 'Availability', explain: 'A classic <strong>Denial of Service</strong>: unauthorised withholding of a service. DoS attacks the A in CIA.' },
            { text: 'A hacker reads the customer credit-card database', cat: 'Confidentiality', explain: 'Unauthorised <strong>disclosure</strong> of information = a confidentiality breach.' },
            { text: 'Malware silently changes salary amounts in payroll data', cat: 'Integrity', explain: 'Data has been maliciously <strong>altered</strong> — integrity ensures data stays correct and unaltered.' },
            { text: 'Office network wiretapped; traffic is being sniffed', cat: 'Confidentiality', explain: 'Snooping/sniffing/wiretapping = <strong>disclosure</strong>, countered by confidentiality services.' },
            { text: 'Ransomware locks every file until a payment is made', cat: 'Availability', explain: 'Authorised users are <strong>prevented from accessing</strong> their own data — availability is gone.' },
            { text: 'A student intercepts his grade file in transit and edits it', cat: 'Integrity', explain: 'Modification in transit — the data no longer matches the source. Integrity attack.' },
            { text: 'Data on the computer no longer matches the source documents', cat: 'Integrity', explain: 'The lecturer’s exact definition of an integrity failure: external consistency is broken.' },
            { text: 'A power cut takes the ticketing system offline — no backup', cat: 'Availability', explain: 'Availability = data/services accessible <strong>as desired by authorised users</strong>. Downtime kills it.' },
            { text: 'An intern emails a confidential price list to a competitor', cat: 'Confidentiality', explain: 'Information leaked to an unauthorised party — pure confidentiality loss.' },
          ],
        },
        {
          type: 'mc',
          prompt: 'A Denial of Service (DoS) attack strikes. Which letter of CIA does it target?',
          choices: ['Availability', 'Confidentiality', 'Integrity', 'All three equally'],
          answer: 0,
          explain: 'DoS floods or blocks a service so authorised users cannot use it — <strong>DoS attacks the A in CIA</strong>. Memorise that line.',
        },
        {
          type: 'mc',
          prompt: 'A supplier denies ever sending the order confirmation you received. Which security objective (beyond CIA) prevents this?',
          choices: ['Non-repudiation', 'Authentication', 'Accountability', 'Authorization'],
          answer: 0,
          explain: '<strong>Non-repudiation</strong> = neither sender nor receiver can deny a transmitted message. Authentication proves identity; accountability traces actions.',
        },
        {
          type: 'mc',
          prompt: '"Every action in the system can be traced to the person responsible." Which objective is this?',
          choices: ['Accountability', 'Non-repudiation', 'Confidentiality', 'Authentication'],
          answer: 0,
          explain: '<strong>Accountability</strong>: actions are traceable to those responsible. (Your own activity log in this app is doing exactly that.)',
        },
      ],
    },

    /* ---------------------------------------------------- Level 2 */
    {
      title: 'Threat Intel',
      desc: 'Vulnerability, threat or attack? Get the vocabulary combat-ready.',
      brief: 'Intelligence reports are in. Separate the weaknesses from the dangers from the actual strikes — then match each threat class to the CIA service that counters it.',
      questions: [
        {
          type: 'sort',
          tag: 'Intel classification',
          prompt: 'Classify each report: Vulnerability, Threat or Attack?',
          cats: ['Vulnerability', 'Threat', 'Attack'],
          items: [
            { text: 'Web server still running an unpatched 3-year-old version', cat: 'Vulnerability', explain: 'An identified <strong>weakness</strong> in a controlled system = vulnerability.' },
            { text: 'A disgruntled ex-employee who still wants revenge', cat: 'Threat', explain: 'A person/entity representing a <strong>constant danger</strong> to assets = threat.' },
            { text: 'SQL injection executed through the search box last night', cat: 'Attack', explain: 'An <strong>act that exploits a vulnerability</strong> = attack, carried out by a threat agent.' },
            { text: 'Factory-default admin password still set on the router', cat: 'Vulnerability', explain: 'A weak spot waiting to be exploited — nothing has happened <em>yet</em>. Vulnerability.' },
            { text: 'Phishing campaign harvests 40 staff logins', cat: 'Attack', explain: 'The violation actually happened — that’s an attack (via social engineering).' },
            { text: 'Organised-crime groups known to target banks like yours', cat: 'Threat', explain: 'A potential violator of security — the danger exists even before any action. Threat.' },
          ],
        },
        {
          type: 'match',
          prompt: 'Counter each class of threat with the right CIA service. (A favourite exam question!)',
          pairs: [
            ['Disclosure — snooping, sniffing, wiretapping', 'Confidentiality services'],
            ['Deception — spoofing, acceptance of false data', 'Integrity services'],
            ['Usurpation — unauthorised control of the system', 'Availability services'],
            ['Interruption of correct operation (Disruption)', 'Integrity services (disruption)'],
          ],
          explain: 'Disclosure → Confidentiality. Deception &amp; Disruption → Integrity. Usurpation → Availability.',
        },
        {
          type: 'sort',
          tag: 'Mechanism triage',
          prompt: 'Prevention, Detection or Reaction — what job is each mechanism doing?',
          cats: ['Prevention', 'Detection', 'Reaction'],
          items: [
            { text: 'Firewall blocks the connection before it reaches the server', cat: 'Prevention', explain: 'Stopping the attack <strong>before it happens</strong> = prevention.' },
            { text: 'IDS raises an alarm: security policy violated at 02:14', cat: 'Detection', explain: 'Noticing that prevention failed = <strong>detection</strong>.' },
            { text: 'Team traces root cause and updates the firewall rules', cat: 'Reaction', explain: 'Responding after a violation, understanding root causes, updating prevention = <strong>reaction</strong>.' },
            { text: 'Encryption makes intercepted traffic unreadable', cat: 'Prevention', explain: 'Encryption <strong>prevents</strong> disclosure even if data is captured.' },
            { text: 'Morning log review uncovers last night’s intrusion', cat: 'Detection', explain: 'Audit logs detect violations after the fact — detection.' },
          ],
        },
        {
          type: 'mc',
          prompt: '"A statement of what is, and what is not, allowed." What is this?',
          choices: ['A security policy', 'A security mechanism', 'A security model', 'An assurance specification'],
          answer: 0,
          explain: '<strong>Policies define security; mechanisms enforce it.</strong> A mechanism is the method/tool/procedure that enforces the policy — and it can even be non-technical.',
        },
        {
          type: 'mc',
          prompt: 'Your company installs a fancy security mechanism… that nobody ever uses. According to Chapter 1, this is:',
          choices: [
            'Worse than not having it — it gives a false sense of security',
            'Fine — it can’t hurt to have it',
            'Good defence in depth',
            'Required by the principle of open design',
          ],
          answer: 0,
          explain: 'It is better NOT to have a mechanism than to have one nobody uses — users may <strong>rely on it without knowing it does nothing</strong>.',
        },
      ],
    },

    /* ---------------------------------------------------- Level 3 */
    {
      title: 'The 8 Principles',
      desc: 'Saltzer & Schroeder are watching. Spot the design principle in action.',
      brief: 'Design review day. Eight scenarios from the field — name the Saltzer & Schroeder principle each one illustrates, then lock in the memory hooks.',
      questions: [
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'Each service account is given only the exact rights it needs for its task — nothing more.',
          choices: ['Least privilege', 'Fail-safe defaults', 'Separation of privilege', 'Complete mediation'],
          answer: 0,
          explain: '<strong>Least privilege</strong>: a subject gets only the privileges it needs. Function, not identity, controls access; rights are discarded after use.',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'The firewall fails to load its config — so it blocks ALL traffic until fixed.',
          choices: ['Fail-safe defaults', 'Economy of mechanism', 'Least common mechanism', 'Open design'],
          answer: 0,
          explain: '<strong>Fail-safe defaults</strong>: unless explicitly granted, access is denied. If an action fails, the system stays as secure as before it began.',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'The architect rejects a clever-but-complex design: "Keep It Simple". Which principle?',
          choices: ['Economy of mechanism', 'Psychological acceptability', 'Least privilege', 'Separation of privilege'],
          answer: 0,
          explain: '<strong>Economy of mechanism</strong> = the KISS principle. Simpler means less can go wrong, and errors are easier to find and fix.',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'A user’s permissions were revoked an hour ago, yet they can still access the file they opened this morning. Which principle was VIOLATED?',
          choices: ['Complete mediation', 'Open design', 'Fail-safe defaults', 'Least common mechanism'],
          answer: 0,
          explain: '<strong>Complete mediation</strong>: EVERY access to EVERY object must be checked — not just the first time. If permissions change, re-check.',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: '"Our cipher is secure even though its full algorithm is published." Which principle?',
          choices: ['Open design', 'Economy of mechanism', 'Least privilege', 'Complete mediation'],
          answer: 0,
          explain: '<strong>Open design</strong>: security must not depend on secrecy of design — that would be security through obscurity. (Keys and passwords stay secret, of course.)',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'Approving a bank transfer over RM50,000 requires TWO managers to enter their codes.',
          choices: ['Separation of privilege', 'Least privilege', 'Fail-safe defaults', 'Psychological acceptability'],
          answer: 0,
          explain: '<strong>Separation of privilege</strong>: never grant permission on a single condition — require multiple conditions. Supports separation of duty and defense in depth.',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'Instead of a shared server, each customer gets an isolated virtual machine.',
          choices: ['Least common mechanism', 'Economy of mechanism', 'Open design', 'Complete mediation'],
          answer: 0,
          explain: '<strong>Least common mechanism</strong>: don’t share mechanisms between users — shared channels leak information (covert channels). Use isolation: VMs, sandboxes.',
        },
        {
          type: 'mc', tag: 'Spot the principle',
          prompt: 'The new 2FA flow was redesigned so logging in takes 3 seconds instead of 3 minutes — otherwise staff would bypass it.',
          choices: ['Psychological acceptability', 'Fail-safe defaults', 'Separation of privilege', 'Least privilege'],
          answer: 0,
          explain: '<strong>Psychological acceptability</strong>: security must not make resources harder to access; hide complexity — or users will work around you.',
        },
        {
          type: 'match',
          prompt: 'Lock in the one-line memory hooks.',
          pairs: [
            ['Least privilege', 'Only what you need'],
            ['Fail-safe defaults', 'Deny by default'],
            ['Open design', 'No security through obscurity'],
            ['Complete mediation', 'Check every access, every time'],
            ['Least common mechanism', 'Don’t share mechanisms'],
          ],
          explain: 'The 8 principles boil down to two big ideas: <strong>Simplicity</strong> and <strong>Restriction</strong>.',
        },
        {
          type: 'mc',
          prompt: 'All 8 principles come back to two big ideas. Which pair?',
          choices: ['Simplicity and Restriction', 'Prevention and Detection', 'Secrecy and Speed', 'Cost and Usability'],
          answer: 0,
          explain: '<strong>Simplicity</strong> (easy to understand, verify, prove safe) and <strong>Restriction</strong> (minimise each entity’s power).',
        },
      ],
    },

    /* ---------------------------------------------------- Level 4 */
    {
      title: 'Clearance Control',
      desc: 'Man the reference monitor: enforce Bell-LaPadula and Biba, live.',
      brief: 'You ARE the reference monitor now. Requests arrive with a subject clearance and an object classification — apply the model’s rules and stamp ALLOW or DENY. Remember: BLP = read down, write up. Biba is the mirror.',
      questions: [
        {
          type: 'decision', tag: 'Bell-LaPadula',
          prompt: 'Apply BLP. Allow or deny?',
          scenario: 'MODEL: Bell-LaPadula (confidentiality)\nSUBJECT: Samuel — clearance SECRET\nREQUEST: READ "Personnel Files" — classified TOP SECRET',
          answer: 'deny',
          explain: '<strong>Simple Security Property — "No Read Up".</strong> Samuel (S) may not read TOP SECRET (TS) material: L(O) &gt; L(S).',
        },
        {
          type: 'decision', tag: 'Bell-LaPadula',
          prompt: 'Apply BLP. Allow or deny?',
          scenario: 'MODEL: Bell-LaPadula (confidentiality)\nSUBJECT: Tamara — clearance TOP SECRET\nREQUEST: READ "Activity Logs" — classified CONFIDENTIAL',
          answer: 'allow',
          explain: 'Reading DOWN is fine in BLP: L(O) ≤ L(S). Tamara (TS) can read anything at or below her clearance. <strong>"Read down, write up."</strong>',
        },
        {
          type: 'decision', tag: 'Bell-LaPadula',
          prompt: 'Apply BLP. Allow or deny?',
          scenario: 'MODEL: Bell-LaPadula (confidentiality)\nSUBJECT: Tamara — clearance TOP SECRET\nREQUEST: WRITE a note into "Telephone List" — classified UNCLASSIFIED',
          answer: 'deny',
          explain: '<strong>Star (*) Property — "No Write Down".</strong> Writing to a lower level could leak secrets downward. Tamara may only write at TS or above.',
        },
        {
          type: 'decision', tag: 'Bell-LaPadula',
          prompt: 'Apply BLP. Allow or deny?',
          scenario: 'MODEL: Bell-LaPadula (confidentiality)\nSUBJECT: Claire — clearance CONFIDENTIAL\nREQUEST: APPEND a report to "Email archive" — classified SECRET',
          answer: 'allow',
          explain: 'Writing UP is allowed in BLP: L(S) ≤ L(O). Claire can’t <em>read</em> SECRET, but she can write into it — no secrets flow downward.',
        },
        {
          type: 'decision', tag: 'Biba',
          prompt: 'Now switch models. Apply Biba. Allow or deny?',
          scenario: 'MODEL: Biba (integrity)\nSUBJECT: Payroll app — integrity level IMPORTANT\nREQUEST: READ data from "random internet feed" — integrity UNKNOWN (lower)',
          answer: 'deny',
          explain: '<strong>Biba: No Read Down.</strong> Don’t read lower-integrity (possibly dirty) data — it would contaminate a high-integrity process. Biba is BLP’s mirror image.',
        },
        {
          type: 'decision', tag: 'Biba',
          prompt: 'Apply Biba. Allow or deny?',
          scenario: 'MODEL: Biba (integrity)\nSUBJECT: Audit system — integrity CRUCIAL\nREQUEST: WRITE a summary into "staff noticeboard" — integrity UNKNOWN (lower)',
          answer: 'allow',
          explain: 'Biba allows writing DOWN: information flows from higher integrity to lower. <strong>"Read up, write down"</strong> — exactly the reverse of BLP.',
        },
        {
          type: 'match',
          prompt: 'Match each security model to its identity.',
          pairs: [
            ['Bell-LaPadula', 'Confidentiality — no read up, no write down'],
            ['Biba', 'Integrity — no read down, no write up'],
            ['Clark-Wilson', 'Commercial integrity — well-formed transactions'],
            ['Chinese Wall', 'Conflict of interest — walls between competitors'],
          ],
          explain: 'BLP and Biba are mirror images. Clark-Wilson adds separation of duties for business. Chinese Wall blocks reads/writes across competing companies.',
        },
        {
          type: 'order',
          prompt: 'Reassemble the Security Life Cycle in order.',
          items: ['Threats', 'Policy', 'Specification', 'Design', 'Implementation', 'Operation'],
          explain: 'Threats → Policy → Specification → Design → Implementation → Operation. In practice each stage feeds back into all earlier ones — feedback from operation is critical and often overlooked.',
        },
        {
          type: 'mc',
          prompt: 'Complete the risk formula: Risk = ?',
          choices: [
            'Assets × Vulnerabilities × Threats',
            'Threats + Attacks − Defences',
            'Cost × Probability × Damage',
            'Assets ÷ Countermeasures',
          ],
          answer: 0,
          explain: '<strong>Risk = Assets × Vulnerabilities × Threats.</strong> Quantitative analysis gives numbers (expected loss); qualitative gives expert judgement.',
        },
        {
          type: 'mc',
          prompt: 'In the Onion Model of defense in depth, which layer is OUTERMOST?',
          choices: ['Application security', 'Hardware security', 'OS kernel security', 'Operating system security'],
          answer: 0,
          explain: 'Outside → in: <strong>Application → Services → Operating system → OS kernel → Hardware</strong>. An attacker must peel every layer.',
        },
      ],
    },
  ],
};
