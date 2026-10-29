export const pad = (n, len = 4) => String(n).padStart(len, '0');

export const makeMemberNumber = (orgSlug, year, seq) =>
  `${orgSlug.toUpperCase().slice(0, 6)}-${year}-${pad(seq)}`;

export const makeCardNumber = (year, rnd) =>
  `CRD-${year}-${rnd.toString('hex').toUpperCase().slice(0, 6)}`;
