export type Testament = 'AT' | 'NT'

export type Category =
  | 'Pentateuco'
  | 'Históricos'
  | 'Poéticos'
  | 'Profetas mayores'
  | 'Profetas menores'
  | 'Evangelios'
  | 'Historia'
  | 'Epístolas paulinas'
  | 'Epístolas generales'
  | 'Profecía'

export interface Book {
  id: string // USFM code, used for storage keys and bible.com links
  name: string
  abbr: string
  chapters: number
  testament: Testament
  category: Category
}

const b = (
  id: string,
  name: string,
  abbr: string,
  chapters: number,
  testament: Testament,
  category: Category,
): Book => ({ id, name, abbr, chapters, testament, category })

export const BOOKS: Book[] = [
  b('GEN', 'Génesis', 'Gn', 50, 'AT', 'Pentateuco'),
  b('EXO', 'Éxodo', 'Éx', 40, 'AT', 'Pentateuco'),
  b('LEV', 'Levítico', 'Lv', 27, 'AT', 'Pentateuco'),
  b('NUM', 'Números', 'Nm', 36, 'AT', 'Pentateuco'),
  b('DEU', 'Deuteronomio', 'Dt', 34, 'AT', 'Pentateuco'),
  b('JOS', 'Josué', 'Jos', 24, 'AT', 'Históricos'),
  b('JDG', 'Jueces', 'Jue', 21, 'AT', 'Históricos'),
  b('RUT', 'Rut', 'Rt', 4, 'AT', 'Históricos'),
  b('1SA', '1 Samuel', '1 S', 31, 'AT', 'Históricos'),
  b('2SA', '2 Samuel', '2 S', 24, 'AT', 'Históricos'),
  b('1KI', '1 Reyes', '1 R', 22, 'AT', 'Históricos'),
  b('2KI', '2 Reyes', '2 R', 25, 'AT', 'Históricos'),
  b('1CH', '1 Crónicas', '1 Cr', 29, 'AT', 'Históricos'),
  b('2CH', '2 Crónicas', '2 Cr', 36, 'AT', 'Históricos'),
  b('EZR', 'Esdras', 'Esd', 10, 'AT', 'Históricos'),
  b('NEH', 'Nehemías', 'Neh', 13, 'AT', 'Históricos'),
  b('EST', 'Ester', 'Est', 10, 'AT', 'Históricos'),
  b('JOB', 'Job', 'Job', 42, 'AT', 'Poéticos'),
  b('PSA', 'Salmos', 'Sal', 150, 'AT', 'Poéticos'),
  b('PRO', 'Proverbios', 'Pr', 31, 'AT', 'Poéticos'),
  b('ECC', 'Eclesiastés', 'Ec', 12, 'AT', 'Poéticos'),
  b('SNG', 'Cantares', 'Cnt', 8, 'AT', 'Poéticos'),
  b('ISA', 'Isaías', 'Is', 66, 'AT', 'Profetas mayores'),
  b('JER', 'Jeremías', 'Jer', 52, 'AT', 'Profetas mayores'),
  b('LAM', 'Lamentaciones', 'Lm', 5, 'AT', 'Profetas mayores'),
  b('EZK', 'Ezequiel', 'Ez', 48, 'AT', 'Profetas mayores'),
  b('DAN', 'Daniel', 'Dn', 12, 'AT', 'Profetas mayores'),
  b('HOS', 'Oseas', 'Os', 14, 'AT', 'Profetas menores'),
  b('JOL', 'Joel', 'Jl', 3, 'AT', 'Profetas menores'),
  b('AMO', 'Amós', 'Am', 9, 'AT', 'Profetas menores'),
  b('OBA', 'Abdías', 'Abd', 1, 'AT', 'Profetas menores'),
  b('JON', 'Jonás', 'Jon', 4, 'AT', 'Profetas menores'),
  b('MIC', 'Miqueas', 'Mi', 7, 'AT', 'Profetas menores'),
  b('NAM', 'Nahúm', 'Nah', 3, 'AT', 'Profetas menores'),
  b('HAB', 'Habacuc', 'Hab', 3, 'AT', 'Profetas menores'),
  b('ZEP', 'Sofonías', 'Sof', 3, 'AT', 'Profetas menores'),
  b('HAG', 'Hageo', 'Hag', 2, 'AT', 'Profetas menores'),
  b('ZEC', 'Zacarías', 'Zac', 14, 'AT', 'Profetas menores'),
  b('MAL', 'Malaquías', 'Mal', 4, 'AT', 'Profetas menores'),
  b('MAT', 'Mateo', 'Mt', 28, 'NT', 'Evangelios'),
  b('MRK', 'Marcos', 'Mr', 16, 'NT', 'Evangelios'),
  b('LUK', 'Lucas', 'Lc', 24, 'NT', 'Evangelios'),
  b('JHN', 'Juan', 'Jn', 21, 'NT', 'Evangelios'),
  b('ACT', 'Hechos', 'Hch', 28, 'NT', 'Historia'),
  b('ROM', 'Romanos', 'Ro', 16, 'NT', 'Epístolas paulinas'),
  b('1CO', '1 Corintios', '1 Co', 16, 'NT', 'Epístolas paulinas'),
  b('2CO', '2 Corintios', '2 Co', 13, 'NT', 'Epístolas paulinas'),
  b('GAL', 'Gálatas', 'Gá', 6, 'NT', 'Epístolas paulinas'),
  b('EPH', 'Efesios', 'Ef', 6, 'NT', 'Epístolas paulinas'),
  b('PHP', 'Filipenses', 'Fil', 4, 'NT', 'Epístolas paulinas'),
  b('COL', 'Colosenses', 'Col', 4, 'NT', 'Epístolas paulinas'),
  b('1TH', '1 Tesalonicenses', '1 Ts', 5, 'NT', 'Epístolas paulinas'),
  b('2TH', '2 Tesalonicenses', '2 Ts', 3, 'NT', 'Epístolas paulinas'),
  b('1TI', '1 Timoteo', '1 Ti', 6, 'NT', 'Epístolas paulinas'),
  b('2TI', '2 Timoteo', '2 Ti', 4, 'NT', 'Epístolas paulinas'),
  b('TIT', 'Tito', 'Tit', 3, 'NT', 'Epístolas paulinas'),
  b('PHM', 'Filemón', 'Flm', 1, 'NT', 'Epístolas paulinas'),
  b('HEB', 'Hebreos', 'He', 13, 'NT', 'Epístolas generales'),
  b('JAS', 'Santiago', 'Stg', 5, 'NT', 'Epístolas generales'),
  b('1PE', '1 Pedro', '1 P', 5, 'NT', 'Epístolas generales'),
  b('2PE', '2 Pedro', '2 P', 3, 'NT', 'Epístolas generales'),
  b('1JN', '1 Juan', '1 Jn', 5, 'NT', 'Epístolas generales'),
  b('2JN', '2 Juan', '2 Jn', 1, 'NT', 'Epístolas generales'),
  b('3JN', '3 Juan', '3 Jn', 1, 'NT', 'Epístolas generales'),
  b('JUD', 'Judas', 'Jud', 1, 'NT', 'Epístolas generales'),
  b('REV', 'Apocalipsis', 'Ap', 22, 'NT', 'Profecía'),
]

export const BOOK_BY_ID: Record<string, Book> = Object.fromEntries(BOOKS.map((bk) => [bk.id, bk]))

export const TOTAL_CHAPTERS = BOOKS.reduce((sum, bk) => sum + bk.chapters, 0)

export const CATEGORIES: Category[] = [
  'Pentateuco',
  'Históricos',
  'Poéticos',
  'Profetas mayores',
  'Profetas menores',
  'Evangelios',
  'Historia',
  'Epístolas paulinas',
  'Epístolas generales',
  'Profecía',
]

// RVR1960 on bible.com
export const readUrl = (bookId: string, chapter = 1) =>
  `https://www.bible.com/bible/149/${bookId}.${chapter}.RVR1960`
