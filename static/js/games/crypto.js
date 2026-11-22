/* Crypto Lab — Chapter 3: Cryptography */
(function () {
  'use strict';

  // Caesar helpers for the interactive decoder
  function caesarShift(text, k) {
    return text.replace(/[A-Z]/g, c =>
      String.fromCharCode((c.charCodeAt(0) - 65 + k + 26 * 10) % 26 + 65));
  }

  function caesarRound(plain, key) {
    const cipher = caesarShift(plain, key);
    return { plain, key, cipher };
  }

  const CAESAR_ROUNDS = [
    caesarRound('SECURITY IS A PROCESS', 7),
    caesarRound('THE CIA TRIAD PROTECTS ASSETS', 19),
  ];

  window.GAME_DEF = {

    tutorial: {
      title: 'Crypto Lab — Briefing',
      slides: [
        `<p>Welcome to the <span class="hl">Crypto Lab</span> — the science of hiding information in plain sight, first fielded by Julius Caesar himself.</p>
         <p>The vocabulary you'll use at every bench:</p>
         <div class="tut-visual">PLAINTEXT   → the original message
CIPHERTEXT  → the encrypted message
ENCRYPT     → plaintext  → ciphertext
DECRYPT     → ciphertext → plaintext
KEY         → the value that drives both</div>`,

        `<p>Different tools deliver different <span class="hl">security objectives</span> — a mapping examiners love:</p>
         <div class="tut-visual">Encryption          →  CONFIDENTIALITY
Hashing             →  INTEGRITY
Digital signatures  →  AUTHENTICATION + NON-REPUDIATION</div>
         <p>Classical ciphers come in two families: <span class="hl">substitution</span> (letters change) and <span class="hl">transposition</span> (letters move). A one-alphabet substitution like Caesar falls to <span class="hl">frequency analysis</span> — count the letters and the mask slips.</p>`,

        `<p>The single most important comparison of the chapter:</p>
         <div class="tut-visual">SYMMETRIC   → ONE shared secret key
              hard part: sharing it safely
              DES · 3DES · AES · Blowfish · IDEA · RC5

ASYMMETRIC  → TWO related keys: public + private
              public key travels openly, private stays home
              RSA · El Gamal · Elliptic Curve</div>
         <p>Rule of thumb: encrypt <em>to</em> someone with <span class="hl">their public key</span>; only their private key can open it.</p>`,

        `<p>And to seal a message with your identity — the <span class="hl">digital signature</span>:</p>
         <div class="tut-visual">1. take the data
2. compute its HASH (digest)
3. encrypt the hash with YOUR PRIVATE KEY
4. attach it to the data</div>
         <p>Only you hold your private key → non-repudiation. Anyone verifies with your public key → authentication. Re-hash the data → integrity. Three objectives, one stamp.</p>`,

        `<p><strong>Your lab schedule</strong></p>
         <ul>
           <li><span class="hl">L1 — Caesar Cracked:</span> break real ciphertext with the shift dial.</li>
           <li><span class="hl">L2 — Cipher Zoo:</span> substitution vs transposition; stream vs block.</li>
           <li><span class="hl">L3 — Key Exchange:</span> pick the right key, every time.</li>
           <li><span class="hl">L4 — Seal of Authenticity:</span> hashes, signatures &amp; certificates.</li>
         </ul>
         <p>The <span class="hl">Tutorial</span> button reopens this briefing whenever you need it.</p>`,
      ],
    },

    levels: [
      /* ---------------------------------------------------- Level 1 */
      {
        title: 'Caesar Cracked',
        desc: 'Turn the shift dial and break real ciphertext by hand.',
        brief: 'Two intercepted messages hit your bench, both Caesar-encrypted. Spin the shift dial until the plaintext emerges, lock it in — then explain WHY this cipher is so breakable.',
        questions: [
          {
            type: 'custom',
            units: 2,
            render(card, api) {
              const { h } = api;
              let round = 0;

              card.append(
                h('p', { class: 'q-type-tag' }, 'Cryptanalysis bench'),
                h('p', { class: 'q-prompt' }, 'Find the shift that decrypts the intercepted message, then lock it in.'),
              );
              const roundLabel = h('p', { class: 'muted', style: 'font-family:var(--mono);font-size:12px' });
              const box = h('div', { class: 'cipher-box' });
              const lockBtn = h('button', { class: 'btn btn-primary' }, 'Lock in this shift');
              const actions = h('div', { class: 'widget-actions' }, lockBtn);
              card.append(roundLabel, box, actions);

              let slider, plainEl, valueEl;

              function renderRound() {
                const r = CAESAR_ROUNDS[round];
                roundLabel.textContent = `Intercept ${round + 1} of ${CAESAR_ROUNDS.length}`;
                box.innerHTML = '';
                box.append(
                  h('div', { class: 'cipher-label' }, 'Intercepted ciphertext'),
                  h('div', { class: 'cipher-text cipher-cipher' }, r.cipher),
                  h('div', { class: 'shift-control' },
                    h('span', { class: 'cipher-label', style: 'margin:0' }, 'Shift'),
                    slider = h('input', { type: 'range', min: '0', max: '25', value: '0' }),
                    valueEl = h('div', { class: 'shift-value' }, '0'),
                  ),
                  h('div', { class: 'cipher-label' }, 'Decrypted with your shift'),
                  plainEl = h('div', { class: 'cipher-text cipher-plain' }, r.cipher),
                );
                slider.addEventListener('input', update);
                update();
              }

              function update() {
                const r = CAESAR_ROUNDS[round];
                const d = parseInt(slider.value, 10);
                valueEl.textContent = String(d);
                plainEl.textContent = caesarShift(r.cipher, -d);
              }

              lockBtn.onclick = () => {
                const r = CAESAR_ROUNDS[round];
                const d = parseInt(slider.value, 10);
                const ok = d === r.key;
                if (ok) api.correct(1); else api.wrong(1);
                lockBtn.disabled = true;
                api.feedback(ok,
                  ok
                    ? `Message recovered: <strong>${r.plain}</strong>. Key = shift ${r.key}. Notice you only had to try at most 25 shifts — a tiny key space is a dead cipher.`
                    : `The key was shift <strong>${r.key}</strong>, revealing: <strong>${r.plain}</strong>. With only 25 possible keys, brute force needs seconds.`,
                  () => {
                    card.querySelector('.feedback').remove();
                    lockBtn.disabled = false;
                    round++;
                    if (round < CAESAR_ROUNDS.length) renderRound();
                    else api.next();
                  });
              };

              renderRound();
            },
          },
          {
            type: 'mc',
            prompt: 'You just broke Caesar by trying shifts. For longer monoalphabetic ciphers, what attack breaks them WITHOUT trying every key?',
            choices: [
              'Frequency analysis — matching letter statistics of the language',
              'Birthday attack',
              'Man-in-the-middle',
              'Chosen-ciphertext attack',
            ],
            answer: 0,
            explain: 'Each letter always maps to the same letter, so the language’s characteristic letter frequencies shine straight through. Count the letters → break the cipher.',
          },
          {
            type: 'mc',
            prompt: 'Why does the Vigenère cipher defeat SIMPLE frequency analysis?',
            choices: [
              'One plaintext letter can map to many different ciphertext letters',
              'It uses numbers instead of letters',
              'Its key is always longer than the message',
              'It rearranges letters instead of replacing them',
            ],
            answer: 0,
            explain: 'Vigenère is <strong>polyalphabetic</strong> — several substitution alphabets rotate with the key, so frequency patterns are smeared out.',
          },
          {
            type: 'mc',
            prompt: 'Which classical cipher is essentially UNBREAKABLE — if used correctly?',
            choices: [
              'One-time pad: random key, as long as the message, never reused',
              'Caesar with a secret shift',
              'Vigenère with a short key',
              'The scytale',
            ],
            answer: 0,
            explain: 'The one-time pad’s three conditions — truly random, at least message-length, used once — make it highly resistant to any cryptanalysis. Break a condition and it falls.',
          },
        ],
      },

      /* ---------------------------------------------------- Level 2 */
      {
        title: 'Cipher Zoo',
        desc: 'Substitution or transposition? Stream or block? Sort the species.',
        brief: 'Specimens on the bench. First decide how each cipher works — do the letters CHANGE (substitution) or just MOVE (transposition)? Then match each species to its identifying fact.',
        questions: [
          {
            type: 'sort',
            tag: 'Taxonomy',
            prompt: 'Substitution (letters change) or Transposition (letters move)?',
            cats: ['Substitution', 'Transposition'],
            items: [
              { text: 'Caesar: every A becomes D, every B becomes E…', cat: 'Substitution', explain: 'Characters are <strong>replaced</strong> — the identity of each letter changes. Monoalphabetic substitution.' },
              { text: 'Scytale: parchment wrapped around a rod of secret diameter', cat: 'Transposition', explain: 'The letters survive intact — only their <strong>order</strong> changes. The rod diameter is effectively the key.' },
              { text: 'ATTACK AT ONCE → AKCNBTAEORTT… (same letters, new order)', cat: 'Transposition', explain: 'Columnar transposition: write in columns, read them out. Letter counts are unchanged — a giveaway for analysts.' },
              { text: 'Vigenère: substitution alphabets rotating with a keyword', cat: 'Substitution', explain: 'Polyalphabetic <strong>substitution</strong> — several alphabets in rotation, which is what defeats simple frequency analysis.' },
              { text: 'Running-key: letters converted to numbers and added to key values mod 26', cat: 'Substitution', explain: 'Adding key values transforms each letter into a different one — substitution by arithmetic.' },
            ],
          },
          {
            type: 'match',
            prompt: 'Match each cipher to its identifying fact.',
            pairs: [
              ['Caesar', 'Shift each letter three to the right — Julius’ own'],
              ['Vigenère', 'Polyalphabetic tableau driven by a repeating key'],
              ['One-time pad', 'Random key, message-length, used once'],
              ['Scytale', 'The rod’s diameter is the key'],
            ],
            explain: 'Substitution and transposition are the two building blocks — modern block ciphers still combine them (Shannon’s substitution-permutation network).',
          },
          {
            type: 'mc',
            prompt: 'A cipher encrypts continuous audio one digit at a time by XOR-ing with a keystream. What type is it?',
            choices: ['Stream cipher', 'Block cipher', 'Transposition cipher', 'Feistel cipher'],
            answer: 0,
            explain: '<strong>Stream ciphers</strong> XOR plaintext digit-by-digit with the keystream — ideal for continuous data (audio, video). Decryption is the same XOR again.',
          },
          {
            type: 'mc',
            prompt: 'Encrypt = plaintext XOR key. How do you DECRYPT a stream cipher?',
            choices: [
              'XOR the ciphertext with the SAME key again',
              'XOR the ciphertext with the inverted key',
              'Shift every bit right by the key length',
              'You need a different decryption algorithm',
            ],
            answer: 0,
            explain: 'XOR-ing twice with the same key returns the original — that’s the beautiful symmetry of XOR: (P ⊕ K) ⊕ K = P.',
          },
          {
            type: 'mc',
            prompt: 'DES encrypts 64-bit blocks with a 56-bit key. What structure is virtually every conventional block cipher (including DES) built on?',
            choices: [
              'The Feistel structure — split the block, rounds of substitute-and-swap',
              'The one-time pad',
              'The Vigenère tableau',
              'Public-key exponentiation',
            ],
            answer: 0,
            explain: 'Horst Feistel’s design: partition the block into halves, substitute one half using a round function + subkey, permute/swap — repeat for multiple rounds.',
          },
          {
            type: 'mc',
            prompt: 'In ECB mode, two identical plaintext blocks produce identical ciphertext blocks. Which mode fixes this by chaining each block to the previous ciphertext?',
            choices: ['CBC — Cipher Block Chaining', 'ECB — Electronic Code Book', 'A longer key', 'Frequency analysis'],
            answer: 0,
            explain: '<strong>CBC</strong> XORs each plaintext block with the previous ciphertext block before encryption; the first block uses an Initialization Vector (IV). Patterns vanish.',
          },
        ],
      },

      /* ---------------------------------------------------- Level 3 */
      {
        title: 'Key Exchange',
        desc: 'Symmetric or asymmetric — and WHICH key do you grab?',
        brief: 'Alice, Bob and a lot of keys. Choose the right key for every job, and sort the algorithm inventory into symmetric and asymmetric bins. One wrong key and the secret leaks.',
        questions: [
          {
            type: 'mc',
            prompt: 'Alice wants to send Bob a CONFIDENTIAL message using public-key crypto. Which key does she encrypt with?',
            choices: ['Bob’s PUBLIC key', 'Bob’s PRIVATE key', 'Alice’s PRIVATE key', 'Alice’s PUBLIC key'],
            answer: 0,
            explain: 'Encrypt <em>to</em> someone with THEIR public key — then only their private key can decrypt it. The public key can travel over insecure media.',
          },
          {
            type: 'mc',
            prompt: '…and which key does Bob use to DECRYPT it?',
            choices: ['Bob’s PRIVATE key', 'Bob’s PUBLIC key', 'Alice’s PUBLIC key', 'The session password'],
            answer: 0,
            explain: 'Text encrypted with one key can only be decrypted with its counterpart — and knowing the public key gives no help finding the private one.',
          },
          {
            type: 'mc',
            prompt: 'What is the HARD problem with symmetric cryptography that asymmetric crypto solves?',
            choices: [
              'Safely sharing the secret key with the other party',
              'Encryption is too slow',
              'Keys are too short',
              'It cannot encrypt long messages',
            ],
            answer: 0,
            explain: 'One shared secret key must somehow travel "out of band" and be kept secret by BOTH parties. Public-key crypto removes that problem — and scales far better.',
          },
          {
            type: 'sort',
            tag: 'Algorithm inventory',
            prompt: 'Symmetric or Asymmetric — file each algorithm.',
            cats: ['Symmetric', 'Asymmetric'],
            items: [
              { text: 'AES (Rijndael)', cat: 'Symmetric', explain: 'The DES replacement (2000). One shared key of 128/192/256 bits, 10/12/14 rounds.' },
              { text: 'RSA', cat: 'Asymmetric', explain: 'The classic public-key algorithm — a public/private key pair.' },
              { text: 'DES / 3DES', cat: 'Symmetric', explain: '56-bit-key block cipher of 1977; broken by 1999, lives on as 3DES.' },
              { text: 'El Gamal', cat: 'Asymmetric', explain: 'Public-key family, also used for digital signatures.' },
              { text: 'Blowfish', cat: 'Symmetric', explain: 'A shared-secret block cipher — same key both ends.' },
              { text: 'Elliptic Curve', cat: 'Asymmetric', explain: 'Public-key crypto with small keys — the EC in ECDSA.' },
              { text: 'IDEA / RC5', cat: 'Symmetric', explain: 'More members of the symmetric family from the notes’ list.' },
            ],
          },
          {
            type: 'mc',
            prompt: 'Which statement about DES is TRUE?',
            choices: [
              'Its 56-bit key was brute-forced by dedicated hardware in under a day',
              'It is still the recommended US standard today',
              'It uses a 256-bit key',
              'It is an asymmetric algorithm',
            ],
            answer: 0,
            explain: '“Deep Crack” broke DES in 22h 15m (1999). NIST had cut the key from 128 to 56 bits. AES (Rijndael, by Rijmen &amp; Daemen) replaced it in 2000.',
          },
          {
            type: 'mc',
            prompt: 'A flaw in DES turned out to be a strength: flipping 1 bit of plaintext changes about half the ciphertext bits. This is called:',
            choices: ['The avalanche effect', 'The birthday paradox', 'Key whitening', 'Perfect secrecy'],
            answer: 0,
            explain: 'The <strong>avalanche effect</strong> — tiny input changes cause massive output changes, hiding all patterns from the analyst.',
          },
        ],
      },

      /* ---------------------------------------------------- Level 4 */
      {
        title: 'Seal of Authenticity',
        desc: 'Hashes, digital signatures, certificates — and the attacks on them.',
        brief: 'Final bench: prove messages are untampered and senders are who they claim. Assemble a digital signature step by step, then match the cryptanalytic attacks prowling outside.',
        questions: [
          {
            type: 'order',
            prompt: 'Create a digital signature — put the steps in order.',
            items: [
              'Take the data to be signed',
              'Compute its hash (the digest)',
              'Encrypt the hash with YOUR PRIVATE key',
              'Attach the encrypted hash to the data',
            ],
            explain: 'Hash + private-key encryption = signature. Only you hold your private key (non-repudiation); anyone verifies with your public key; re-hashing proves integrity.',
          },
          {
            type: 'mc',
            prompt: 'You receive a signed contract from a supplier. Which key do you use to VERIFY the signature?',
            choices: ['The supplier’s PUBLIC key', 'The supplier’s PRIVATE key', 'Your own private key', 'A shared session key'],
            answer: 0,
            explain: 'The signature was made with their private key, so their <strong>public key</strong> — available to everyone — verifies it. If it checks out, only they could have signed.',
          },
          {
            type: 'match',
            prompt: 'Match each security objective to the crypto tool that delivers it.',
            pairs: [
              ['Confidentiality', 'Encryption (symmetric / asymmetric)'],
              ['Integrity', 'Hash functions'],
              ['Authentication + non-repudiation', 'Digital signatures'],
              ['Binding a name to a public key', 'X.509 certificate from a CA'],
            ],
            explain: 'A certificate is a CA-signed binding of an entity’s name to its public key — everyone can check it because the CA’s public key is well known.',
          },
          {
            type: 'mc',
            prompt: 'A hash function converts variable-size input into fixed-size output. Which property must it have to be SECURE?',
            choices: [
              'It is practically impossible to recreate the input from the hash value',
              'The output must be longer than the input',
              'The same input may give different outputs',
              'It must be reversible with the right key',
            ],
            answer: 0,
            explain: 'One-way-ness plus collision resistance. Also required: determinism, efficiency, uniformity, low collision probability. MD5 and SHA-1 fell; SHA-3 stands.',
          },
          {
            type: 'match',
            prompt: 'Identify the attacks prowling the lab perimeter.',
            pairs: [
              ['Frequency analysis', 'Match ciphertext letter statistics to the language'],
              ['Known-plaintext', 'Sessions always start with "LOGIN" — leverage it'],
              ['Man-in-the-middle', 'Sit between two parties, run separate key exchanges'],
              ['Birthday attack', 'Hunt hash collisions via the birthday paradox'],
              ['Chosen-plaintext', 'Run your own inputs through a captured cipher device'],
            ],
            explain: '23 people → 50% chance two share a birthday. Applied to hashing: collisions appear far sooner than intuition suggests, so output size matters enormously.',
          },
          {
            type: 'mc',
            prompt: 'Why does a Certification Authority (CA) sign your certificate with the CA’s PRIVATE key?',
            choices: [
              'So everyone can verify the certificate using the CA’s well-known public key',
              'To keep the certificate confidential',
              'To make the certificate smaller',
              'Because your own keys expired',
            ],
            answer: 0,
            explain: 'The CA is a trusted third party. Its signature grants validity; since its public key is well known, anyone can check that the binding (name ↔ public key) is genuine. Format: X.509.',
          },
        ],
      },
    ],
  };
})();
