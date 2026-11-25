import { describe, expect, it } from 'vitest';
import { shortCite, surname } from '../src/lib/format';

describe('short citations', () => {
  it('uses the surname of Western names', () => {
    expect(surname('Eric H. Cline')).toBe('Cline');
    expect(surname('Flavius Josephus')).toBe('Josephus');
  });

  it('keeps the known part of classical Arabic names', () => {
    expect(surname('Ibn Kathir')).toBe('Ibn Kathir');
    expect(surname("Ibn 'Asakir")).toBe("Ibn 'Asakir");
    expect(surname("Ibn Hajar al-'Asqalani")).toBe('Ibn Hajar');
    expect(surname('al-Hakim al-Naysaburi')).toBe('al-Hakim');
    expect(surname('al-Bukhari')).toBe('al-Bukhari');
    expect(surname('Muhammad Nasir al-Din al-Albani')).toBe('al-Albani');
    expect(surname("Muhammad al-Tahir Ibn 'Ashur")).toBe("Ibn 'Ashur");
    expect(surname("'Abd al-'Aziz Ibn Baz")).toBe('Ibn Baz');
    expect(surname('Muhammad al-Amin al-Shinqiti')).toBe('al-Shinqiti');
  });

  it('formats a citation with its locator', () => {
    const src = { id: 'x', type: 'book' as const, title: 'T', authors: ["Ibn 'Asakir"] };
    expect(shortCite(src, { id: 'x', locator: '1/32' })).toBe("Ibn 'Asakir, 1/32");
  });
});
