export function latinToCyrillic(str: string): string {
  if (!str) return str;
  let s = str;

  s = s.replace(/([oO]|[gG])[’‘`'´]/g, (match, letter) => {
    if (letter === "o") return "ў";
    if (letter === "O") return "Ў";
    if (letter === "g") return "ғ";
    if (letter === "G") return "Ғ";
    return match;
  });

  s = s.replace(/\bYe/g, "Е").replace(/\bye/g, "е").replace(/\bYE/g, "Е");
  s = s.replace(/([aeiouyoAEIOUYOўЎ])ye/g, "$1е")
    .replace(/([aeiouyoAEIOUYOўЎ])Ye/g, "$1Е")
    .replace(/([aeiouyoAEIOUYOўЎ])YE/g, "$1Е");

  s = s.replace(/Ch/g, "Ч").replace(/CH/g, "Ч").replace(/ch/g, "ч");
  s = s.replace(/Sh/g, "Ш").replace(/SH/g, "Ш").replace(/sh/g, "ш");
  s = s.replace(/Yu/g, "Ю").replace(/YU/g, "Ю").replace(/yu/g, "ю");
  s = s.replace(/Ya/g, "Я").replace(/YA/g, "Я").replace(/ya/g, "я");
  s = s.replace(/Yo/g, "Ё").replace(/YO/g, "Ё").replace(/yo/g, "ё");

  s = s.replace(/\bE/g, "Э").replace(/\be/g, "э");
  s = s.replace(/([aeieuoAEIEUOўЎ])e/g, "$1э")
    .replace(/([aeieuoAEIEUOўЎ])E/g, "$1Э");

  const charMapping: Record<string, string> = {
    A: "А", a: "а", B: "Б", b: "б", D: "Д", d: "д", F: "Ф", f: "ф",
    G: "Г", g: "г", H: "Ҳ", h: "ҳ", I: "И", i: "и", J: "Ж", j: "ж",
    K: "К", k: "к", L: "Л", l: "л", M: "М", m: "м", N: "Н", n: "н",
    O: "О", o: "о", P: "П", p: "п", Q: "Қ", q: "қ", R: "Р", r: "р",
    S: "С", s: "с", T: "Т", t: "т", U: "У", u: "у", V: "В", v: "в",
    X: "Х", x: "х", Y: "Й", y: "й", Z: "З", z: "з", E: "Е", e: "е",
    "'": "ъ", "’": "ъ", "‘": "ъ", "`": "ъ",
  };

  let output = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    output += charMapping[char] ?? char;
  }
  return output;
}

export function cyrillicToLatin(str: string): string {
  if (!str) return str;
  let s = str;

  s = s.replace(/Ш/g, "Sh").replace(/ш/g, "sh");
  s = s.replace(/Ч/g, "Ch").replace(/ч/g, "ch");
  s = s.replace(/Ю/g, "Yu").replace(/ю/g, "yu");
  s = s.replace(/Я/g, "Ya").replace(/я/g, "ya");
  s = s.replace(/Ё/g, "Yo").replace(/ё/g, "yo");
  s = s.replace(/Ў/g, "O'").replace(/ў/g, "o'");
  s = s.replace(/Ғ/g, "G'").replace(/ғ/g, "g'");
  s = s.replace(/Ц/g, "Ts").replace(/ц/g, "ts");

  const charMapping: Record<string, string> = {
    А: "A", а: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g",
    Д: "D", д: "d", Е: "E", е: "e", Ж: "J", ж: "j", З: "Z", з: "z",
    И: "I", и: "i", Й: "Y", й: "y", К: "K", к: "k", Л: "L", л: "l",
    М: "M", м: "m", Н: "N", н: "n", О: "O", о: "o", П: "P", п: "p",
    Р: "R", р: "r", С: "S", с: "s", Т: "T", т: "t", У: "U", у: "u",
    Ф: "F", ф: "f", Х: "X", х: "x", Ҳ: "H", ҳ: "h", Қ: "Q", қ: "q",
    Э: "E", э: "e", ъ: "'", Ъ: "'",
  };

  let output = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    output += charMapping[char] ?? char;
  }
  return output;
}
