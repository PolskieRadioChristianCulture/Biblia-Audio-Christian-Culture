export interface UbgBookMeta {
  id: string;
  name: string;
  aliases: string[];
  abbr: string;
  testament: 'ST' | 'NT';
  startPage: number;
  endPage: number;
  chaptersCount: number;
}

export const UBG_BIBLE_INFO = {
  title: 'Pismo Święte Stary i Nowy Testament (UBG)',
  edition: 'Uwspółcześniona Biblia Gdańska',
  year: 2024,
  publisher: 'Fundacja Wrota Nadziei, Olsztyn',
  totalPages: 1360,
  pdfFileName: 'Pismo_Swiete_UBG.pdf',
  pdfPath: '/bible/Pismo_Swiete_UBG.pdf',
  license: 'Wydawca wyraża zgodę na kopiowanie i rozpowszechnianie całości lub części publikacji bez czerpania korzyści finansowych i bez wprowadzania jakichkolwiek zmian.',
  oldTestamentCount: 39,
  newTestamentCount: 27,
  totalBooks: 66,
};

export const UBG_BOOKS: UbgBookMeta[] = [
  // STARY TESTAMENT (39 ksiąg)
  { id: 'rdz', name: 'Księga Rodzaju', aliases: ['1 Księga Mojżeszowa', 'Genesis'], abbr: 'Rdz', testament: 'ST', startPage: 9, endPage: 71, chaptersCount: 50 },
  { id: 'wj', name: 'Księga Wyjścia', aliases: ['2 Księga Mojżeszowa', 'Exodus'], abbr: 'Wj', testament: 'ST', startPage: 72, endPage: 122, chaptersCount: 40 },
  { id: 'kpl', name: 'Księga Kapłańska', aliases: ['3 Księga Mojżeszowa', 'Leviticus'], abbr: 'Kpł', testament: 'ST', startPage: 123, endPage: 161, chaptersCount: 27 },
  { id: 'lb', name: 'Księga Liczb', aliases: ['4 Księga Mojżeszowa', 'Numeri'], abbr: 'Lb', testament: 'ST', startPage: 162, endPage: 214, chaptersCount: 36 },
  { id: 'pwt', name: 'Księga Powtórzonego Prawa', aliases: ['5 Księga Mojżeszowa', 'Deuteronomium'], abbr: 'Pwt', testament: 'ST', startPage: 215, endPage: 259, chaptersCount: 34 },
  { id: 'joz', name: 'Księga Jozuego', aliases: ['Jozue'], abbr: 'Joz', testament: 'ST', startPage: 260, endPage: 289, chaptersCount: 24 },
  { id: 'sdz', name: 'Księga Sędziów', aliases: ['Sędziowie'], abbr: 'Sdz', testament: 'ST', startPage: 290, endPage: 319, chaptersCount: 21 },
  { id: 'rt', name: 'Księga Rut', aliases: ['Rut'], abbr: 'Rt', testament: 'ST', startPage: 320, endPage: 324, chaptersCount: 4 },
  { id: '1sm', name: 'I Księga Samuela', aliases: ['1 Księga Samuela', '1 Sm'], abbr: '1Sm', testament: 'ST', startPage: 325, endPage: 364, chaptersCount: 31 },
  { id: '2sm', name: 'II Księga Samuela', aliases: ['2 Księga Samuela', '2 Sm'], abbr: '2Sm', testament: 'ST', startPage: 365, endPage: 397, chaptersCount: 24 },
  { id: '1krl', name: 'I Księga Królewska', aliases: ['1 Księga Królewska', '1 Krl'], abbr: '1Krl', testament: 'ST', startPage: 398, endPage: 437, chaptersCount: 22 },
  { id: '2krl', name: 'II Księga Królewska', aliases: ['2 Księga Królewska', '2 Krl'], abbr: '2Krl', testament: 'ST', startPage: 438, endPage: 474, chaptersCount: 25 },
  { id: '1krn', name: 'I Księga Kronik', aliases: ['1 Księga Kronik', '1 Krn'], abbr: '1Krn', testament: 'ST', startPage: 475, endPage: 510, chaptersCount: 29 },
  { id: '2krn', name: 'II Księga Kronik', aliases: ['2 Księga Kronik', '2 Krn'], abbr: '2Krn', testament: 'ST', startPage: 511, endPage: 553, chaptersCount: 36 },
  { id: 'ezd', name: 'Księga Ezdrasza', aliases: ['Ezdrasz'], abbr: 'Ezd', testament: 'ST', startPage: 554, endPage: 566, chaptersCount: 10 },
  { id: 'ne', name: 'Księga Nehemiasza', aliases: ['Nehemiasz'], abbr: 'Ne', testament: 'ST', startPage: 567, endPage: 584, chaptersCount: 13 },
  { id: 'est', name: 'Księga Estery', aliases: ['Estera'], abbr: 'Est', testament: 'ST', startPage: 585, endPage: 594, chaptersCount: 10 },
  { id: 'hi', name: 'Księga Hioba', aliases: ['Hiob'], abbr: 'Hi', testament: 'ST', startPage: 595, endPage: 627, chaptersCount: 42 },
  { id: 'ps', name: 'Księga Psalmów', aliases: ['Psalmy', 'Psałterz'], abbr: 'Ps', testament: 'ST', startPage: 628, endPage: 708, chaptersCount: 150 },
  { id: 'prz', name: 'Księga Przysłów', aliases: ['Przypowieści Salomona', 'Przysłowia'], abbr: 'Prz', testament: 'ST', startPage: 709, endPage: 735, chaptersCount: 31 },
  { id: 'kaz', name: 'Księga Kaznodziei', aliases: ['Kohelet', 'Ekklezjastes'], abbr: 'Kaz', testament: 'ST', startPage: 736, endPage: 745, chaptersCount: 12 },
  { id: 'pnp', name: 'Pieśń nad Pieśniami', aliases: ['Pieśń Salomona'], abbr: 'Pnp', testament: 'ST', startPage: 746, endPage: 750, chaptersCount: 8 },
  { id: 'iz', name: 'Księga Izajasza', aliases: ['Izajasz'], abbr: 'Iz', testament: 'ST', startPage: 751, endPage: 810, chaptersCount: 66 },
  { id: 'jr', name: 'Księga Jeremiasza', aliases: ['Jeremiasz'], abbr: 'Jr', testament: 'ST', startPage: 811, endPage: 877, chaptersCount: 52 },
  { id: 'lm', name: 'Księga Lamentacji', aliases: ['Lamentacje', 'Treny Jeremiasza'], abbr: 'Lm', testament: 'ST', startPage: 878, endPage: 883, chaptersCount: 5 },
  { id: 'ez', name: 'Księga Ezechiela', aliases: ['Ezechiel'], abbr: 'Ez', testament: 'ST', startPage: 884, endPage: 945, chaptersCount: 48 },
  { id: 'dn', name: 'Księga Daniela', aliases: ['Daniel'], abbr: 'Dn', testament: 'ST', startPage: 946, endPage: 964, chaptersCount: 12 },
  { id: 'oz', name: 'Księga Ozeasza', aliases: ['Ozeasz'], abbr: 'Oz', testament: 'ST', startPage: 965, endPage: 973, chaptersCount: 14 },
  { id: 'jl', name: 'Księga Joela', aliases: ['Joel'], abbr: 'Jl', testament: 'ST', startPage: 974, endPage: 977, chaptersCount: 3 },
  { id: 'am', name: 'Księga Amosa', aliases: ['Amos'], abbr: 'Am', testament: 'ST', startPage: 978, endPage: 984, chaptersCount: 9 },
  { id: 'ab', name: 'Księga Abdiasza', aliases: ['Abdiasz'], abbr: 'Ab', testament: 'ST', startPage: 985, endPage: 986, chaptersCount: 1 },
  { id: 'jon', name: 'Księga Jonasza', aliases: ['Jonasz'], abbr: 'Jon', testament: 'ST', startPage: 987, endPage: 989, chaptersCount: 4 },
  { id: 'mi', name: 'Księga Micheasza', aliases: ['Micheasz'], abbr: 'Mi', testament: 'ST', startPage: 990, endPage: 994, chaptersCount: 7 },
  { id: 'na', name: 'Księga Nahuma', aliases: ['Nahum'], abbr: 'Na', testament: 'ST', startPage: 995, endPage: 997, chaptersCount: 3 },
  { id: 'ha', name: 'Księga Habakuka', aliases: ['Habakuk'], abbr: 'Ha', testament: 'ST', startPage: 998, endPage: 1000, chaptersCount: 3 },
  { id: 'so', name: 'Księga Sofoniasza', aliases: ['Sofoniasz'], abbr: 'So', testament: 'ST', startPage: 1001, endPage: 1003, chaptersCount: 3 },
  { id: 'ag', name: 'Księga Aggeusza', aliases: ['Aggeusz'], abbr: 'Ag', testament: 'ST', startPage: 1004, endPage: 1005, chaptersCount: 2 },
  { id: 'za', name: 'Księga Zachariasza', aliases: ['Zachariasz'], abbr: 'Za', testament: 'ST', startPage: 1006, endPage: 1016, chaptersCount: 14 },
  { id: 'ml', name: 'Księga Malachiasza', aliases: ['Malachiasz'], abbr: 'Ml', testament: 'ST', startPage: 1017, endPage: 1022, chaptersCount: 4 },

  // NOWY TESTAMENT (27 ksiąg)
  { id: 'mt', name: 'Ewangelia Mateusza', aliases: ['Ewangelia wg św. Mateusza', 'Mateusz'], abbr: 'Mt', testament: 'NT', startPage: 1023, endPage: 1062, chaptersCount: 28 },
  { id: 'mk', name: 'Ewangelia Marka', aliases: ['Ewangelia wg św. Marka', 'Marek'], abbr: 'Mk', testament: 'NT', startPage: 1063, endPage: 1088, chaptersCount: 16 },
  { id: 'lk', name: 'Ewangelia Łukasza', aliases: ['Ewangelia wg św. Łukasza', 'Łukasz'], abbr: 'Łk', testament: 'NT', startPage: 1089, endPage: 1131, chaptersCount: 24 },
  { id: 'j', name: 'Ewangelia Jana', aliases: ['Ewangelia wg św. Jana', 'Jan'], abbr: 'J', testament: 'NT', startPage: 1132, endPage: 1164, chaptersCount: 21 },
  { id: 'dz', name: 'Dzieje Apostolskie', aliases: ['Dzieje'], abbr: 'Dz', testament: 'NT', startPage: 1165, endPage: 1205, chaptersCount: 28 },
  { id: 'rz', name: 'List do Rzymian', aliases: ['Rzymian'], abbr: 'Rz', testament: 'NT', startPage: 1206, endPage: 1223, chaptersCount: 16 },
  { id: '1kor', name: 'I List do Koryntian', aliases: ['1 List do Koryntian', '1 Kor'], abbr: '1Kor', testament: 'NT', startPage: 1224, endPage: 1240, chaptersCount: 16 },
  { id: '2kor', name: 'II List do Koryntian', aliases: ['2 List do Koryntian', '2 Kor'], abbr: '2Kor', testament: 'NT', startPage: 1241, endPage: 1252, chaptersCount: 13 },
  { id: 'ga', name: 'List do Galacjan', aliases: ['Galacjan', 'Ga'], abbr: 'Ga', testament: 'NT', startPage: 1253, endPage: 1258, chaptersCount: 6 },
  { id: 'ef', name: 'List do Efezjan', aliases: ['Efezjan', 'Ef'], abbr: 'Ef', testament: 'NT', startPage: 1259, endPage: 1264, chaptersCount: 6 },
  { id: 'flp', name: 'List do Filipian', aliases: ['Filipian', 'Flp'], abbr: 'Flp', testament: 'NT', startPage: 1265, endPage: 1268, chaptersCount: 4 },
  { id: 'kol', name: 'List do Kolosan', aliases: ['Kolosan', 'Kol'], abbr: 'Kol', testament: 'NT', startPage: 1269, endPage: 1272, chaptersCount: 4 },
  { id: '1tes', name: 'I List do Tesaloniczan', aliases: ['1 List do Tesaloniczan', '1 Tes'], abbr: '1Tes', testament: 'NT', startPage: 1273, endPage: 1276, chaptersCount: 5 },
  { id: '2tes', name: 'II List do Tesaloniczan', aliases: ['2 List do Tesaloniczan', '2 Tes'], abbr: '2Tes', testament: 'NT', startPage: 1277, endPage: 1278, chaptersCount: 3 },
  { id: '1tm', name: 'I List do Tymoteusza', aliases: ['1 List do Tymoteusza', '1 Tm'], abbr: '1Tm', testament: 'NT', startPage: 1279, endPage: 1283, chaptersCount: 6 },
  { id: '2tm', name: 'II List do Tymoteusza', aliases: ['2 List do Tymoteusza', '2 Tm'], abbr: '2Tm', testament: 'NT', startPage: 1284, endPage: 1287, chaptersCount: 4 },
  { id: 'tt', name: 'List do Tytusa', aliases: ['Tytus', 'Tt'], abbr: 'Tt', testament: 'NT', startPage: 1288, endPage: 1289, chaptersCount: 3 },
  { id: 'flm', name: 'List do Filemona', aliases: ['Filemon', 'Flm'], abbr: 'Flm', testament: 'NT', startPage: 1290, endPage: 1290, chaptersCount: 1 },
  { id: 'hbr', name: 'List do Hebrajczyków', aliases: ['Hebrajczyków', 'Hbr'], abbr: 'Hbr', testament: 'NT', startPage: 1291, endPage: 1303, chaptersCount: 13 },
  { id: 'jk', name: 'List Jakuba', aliases: ['Jakub', 'Jk'], abbr: 'Jk', testament: 'NT', startPage: 1304, endPage: 1308, chaptersCount: 5 },
  { id: '1p', name: 'I List Piotra', aliases: ['1 List Piotra', '1 P'], abbr: '1P', testament: 'NT', startPage: 1309, endPage: 1313, chaptersCount: 5 },
  { id: '2p', name: 'II List Piotra', aliases: ['2 List Piotra', '2 P'], abbr: '2P', testament: 'NT', startPage: 1314, endPage: 1316, chaptersCount: 3 },
  { id: '1j', name: 'I List Jana', aliases: ['1 List Jana', '1 J'], abbr: '1J', testament: 'NT', startPage: 1317, endPage: 1321, chaptersCount: 5 },
  { id: '2j', name: 'II List Jana', aliases: ['2 List Jana', '2 J'], abbr: '2J', testament: 'NT', startPage: 1322, endPage: 1322, chaptersCount: 1 },
  { id: '3j', name: 'III List Jana', aliases: ['3 List Jana', '3 J'], abbr: '3J', testament: 'NT', startPage: 1323, endPage: 1323, chaptersCount: 1 },
  { id: 'jud', name: 'List Judy', aliases: ['Juda', 'Jud'], abbr: 'Jud', testament: 'NT', startPage: 1324, endPage: 1325, chaptersCount: 1 },
  { id: 'obj', name: 'Księga Objawienia', aliases: ['Apokalipsa św. Jana', 'Objawienie Jana', 'Apokalipsa'], abbr: 'Obj', testament: 'NT', startPage: 1326, endPage: 1345, chaptersCount: 22 },
];

export function findUbgBook(query: string): UbgBookMeta | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // 1. Exact match by ID, abbreviation, full name, or alias
  const exact = UBG_BOOKS.find(
    (b) =>
      b.id === q ||
      b.abbr.toLowerCase() === q ||
      b.name.toLowerCase() === q ||
      b.aliases.some((a) => a.toLowerCase() === q)
  );
  if (exact) return exact;

  // 2. Specific check for Apokalipsa / Objawienie
  if (q.includes('apokalips') || q.includes('objawien')) {
    return UBG_BOOKS.find((b) => b.id === 'obj');
  }

  // 3. Normalized includes match
  return UBG_BOOKS.find(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      q.includes(b.name.toLowerCase()) ||
      b.aliases.some((a) => a.length > 3 && (q.includes(a.toLowerCase()) || a.toLowerCase().includes(q)))
  );
}
