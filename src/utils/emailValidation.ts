// Validacao de email no signup pra reduzir bounce rate dos emails de auth.
// Bloqueia formato invalido, dominios descartaveis comuns, e sugere
// correcao de typos comuns. Roda no client antes de chamar supabase.auth.signUp.

const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'throwaway.email', 'yopmail.com', 'dispostable.com',
  'maildrop.cc', 'getnada.com', 'trashmail.com', 'spamgourmet.com',
  'sharklasers.com', 'fakeinbox.com', 'mintemail.com', 'spam4.me',
  'emailondeck.com', 'mailcatch.com', 'mohmal.com', 'tempinbox.com',
]);

// Typos comuns em dominios populares no Brasil
const TYPO_FIXES: Record<string, string> = {
  // Gmail
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gmal.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com', 'gmeil.com': 'gmail.com', 'gmil.com': 'gmail.com',
  'gmail.con': 'gmail.com', 'gmail.copm': 'gmail.com',
  // Hotmail
  'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com', 'hotmaill.com': 'hotmail.com', 'hotmail.cm': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  // Yahoo
  'yahooo.com': 'yahoo.com', 'yhaoo.com': 'yahoo.com', 'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com', 'yaoo.com': 'yahoo.com',
  // Outlook
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outloook.com': 'outlook.com',
  'outlook.co': 'outlook.com', 'outlock.com': 'outlook.com',
  // Brasileiros
  'uol.cm': 'uol.com.br', 'uol.com': 'uol.com.br',
  'bol.cm': 'bol.com.br', 'bol.com': 'bol.com.br',
  'icloud.co': 'icloud.com', 'iclod.com': 'icloud.com', 'iclud.com': 'icloud.com',
};

export interface EmailValidation {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

export function validateEmail(rawEmail: string): EmailValidation {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    return { valid: false, error: 'Digite seu email.' };
  }

  if (!VALID_EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Email invalido. Verifique o formato (ex: nome@dominio.com).' };
  }

  const domain = email.split('@')[1];

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Use um email permanente (Gmail, Outlook, etc.), nao um email descartavel/temporario.',
    };
  }

  if (TYPO_FIXES[domain]) {
    const corrected = email.split('@')[0] + '@' + TYPO_FIXES[domain];
    return {
      valid: false,
      suggestion: corrected,
      error: `Voce quis dizer ${corrected}?`,
    };
  }

  return { valid: true };
}
