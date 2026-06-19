/* ═══════════════════════════════════════════
   Dictionnaire manuel IPPOO  ,  source : Français
   Utilisé en priorité avant l'API MyMemory.
   Indispensable pour les langues sans support API
   (Fon, Peul, Dioula, Sénoufo, Djerma).
   Codes BCP-47 personnalisés : fon, ff, dyu, sef, dje
   ═══════════════════════════════════════════ */

export type DictCode =
  | "en"
  | "ar"
  | "yo"
  | "ha"
  | "ig"
  | "wo"
  | "ln"
  | "bm"
  | "fon"
  | "ff"
  | "dyu"
  | "sef"
  | "dje";

type Entry = Partial<Record<DictCode, string>>;

/** Termes essentiels de l'UI. Clé = chaîne française exacte (sans espaces autour). */
export const DICTIONARY: Record<string, Entry> = {
  // Navigation
  "Accueil": { en: "Home", ar: "الرئيسية", yo: "Ilé", ha: "Gida", ig: "Ụlọ", wo: "Kër", ln: "Ndako", bm: "So", fon: "Xwé", ff: "Galle", dyu: "Lu", sef: "Pyo", dje: "Fu" },
  "Explorer": { en: "Explore", ar: "استكشاف", yo: "Ṣàwárí", ha: "Bincika", ig: "Chọpụta", wo: "Seet", ln: "Luka", bm: "Ɲini", fon: "Ba", ff: "Yiilde", dyu: "Ɲini", sef: "Yiri", dje: "Cera" },
  "Promos": { en: "Deals", ar: "عروض", yo: "Àwọn ìpolówó", ha: "Tallace-tallace", ig: "Nrụnye", wo: "Promo", ln: "Bapromo", bm: "Sɔngɔdaba", fon: "Akwɛ kpɔnnu", ff: "Dolo", dyu: "Sɔngɔdaba", sef: "Promo", dje: "Promo" },
  "Commandes": { en: "Orders", ar: "الطلبات", yo: "Àwọn àṣẹ", ha: "Ododa", ig: "Iwu", wo: "Komaand", ln: "Bakomandi", bm: "Komandiw", fon: "Kɔmandi", ff: "Komandeeji", dyu: "Komandiw", sef: "Komandi", dje: "Komandiyaŋ" },
  "Panier": { en: "Cart", ar: "السلة", yo: "Apò", ha: "Kwando", ig: "Akpa", wo: "Pañe", ln: "Sani", bm: "Bɔrɔ", fon: "Bɔ̀", ff: "Mbasu", dyu: "Bɔrɔ", sef: "Saaga", dje: "Cɛw" },
  "Profil": { en: "Profile", ar: "الملف الشخصي", yo: "Ẹ̀dà ara", ha: "Bayanin sirri", ig: "Profaịlụ", wo: "Profil", ln: "Profil", bm: "Profil", fon: "Profil", ff: "Profil", dyu: "Profil", sef: "Profil", dje: "Profil" },
  "Paramètres": { en: "Settings", ar: "الإعدادات", yo: "Àwọn ètò", ha: "Saituna", ig: "Ntọala", wo: "Tëralin", ln: "Bisɛnga", bm: "Labɛnniw", fon: "Sɛnnu", ff: "Tabintinɗe", dyu: "Labɛnniw", sef: "Sariin", dje: "Sanjiyaŋ" },
  "Notifications": { en: "Notifications", ar: "الإشعارات", yo: "Ìfitónilétí", ha: "Sanarwa", ig: "Ọkwa", wo: "Yegle", ln: "Bayebisi", bm: "Kibaruyaw", fon: "Wɛnsagbe", ff: "Habruuji", dyu: "Kibaruw", sef: "Kibaru", dje: "Habaru" },
  "Wallet": { en: "Wallet", ar: "المحفظة", yo: "Àpò owó", ha: "Walat", ig: "Akpa ego", wo: "Pochet", ln: "Pochet", bm: "Wari bɔrɔ", fon: "Akwɛ bɔ̀", ff: "Mbookoodi", dyu: "Wari bɔrɔ", sef: "Wari saa", dje: "Noru fu" },
  "Aide": { en: "Help", ar: "مساعدة", yo: "Ìrànlọ́wọ́", ha: "Taimako", ig: "Enyemaka", wo: "Dimbalante", ln: "Lisalisi", bm: "Dɛmɛ", fon: "Alɔdo", ff: "Ballal", dyu: "Dɛmɛ", sef: "Dɛmɛ", dje: "Faaba" },

  // Actions
  "Rechercher": { en: "Search", ar: "بحث", yo: "Ṣàwárí", ha: "Nema", ig: "Chọọ", wo: "Seet", ln: "Luka", bm: "Ɲini", fon: "Ba", ff: "Yiilde", dyu: "Ɲini", sef: "Yiri", dje: "Cera" },
  "Connexion": { en: "Sign in", ar: "تسجيل الدخول", yo: "Wọlé", ha: "Shiga", ig: "Banye", wo: "Dugg", ln: "Kokɔta", bm: "Don", fon: "Bibyɔ", ff: "Naatugol", dyu: "Don", sef: "Den", dje: "Furo" },
  "Inscription": { en: "Sign up", ar: "تسجيل", yo: "Forúkọ sílẹ̀", ha: "Yi rajista", ig: "Debanye aha", wo: "Bind sa tur", ln: "Komikoma", bm: "Tɔgɔ sɛbɛ", fon: "Nyikɔ wlan", ff: "Innde winndugol", dyu: "Tɔgɔ sɛbɛ", sef: "Toon sɛbɛ", dje: "Maa nooru" },
  "Déconnexion": { en: "Sign out", ar: "تسجيل الخروج", yo: "Jáde", ha: "Fita", ig: "Apụ", wo: "Génn", ln: "Kobima", bm: "Bɔ", fon: "Tɔn", ff: "Yaltude", dyu: "Bɔ", sef: "Bɔ", dje: "Fatta" },
  "Modifier": { en: "Edit", ar: "تعديل", yo: "Ṣàtúnṣe", ha: "Gyara", ig: "Dezie", wo: "Soppi", ln: "Kobongisa", bm: "Yɛlɛma", fon: "Huzu", ff: "Wattude", dyu: "Yɛlɛma", sef: "Yɛlɛma", dje: "Bara" },
  "Supprimer": { en: "Delete", ar: "حذف", yo: "Pa rẹ́", ha: "Goge", ig: "Hichapụ", wo: "Far", ln: "Kolongola", bm: "Bɔ", fon: "Sɔ́", ff: "Mommbude", dyu: "Bɔ", sef: "Bɔ", dje: "Tuusu" },
  "Ajouter": { en: "Add", ar: "إضافة", yo: "Ṣàfikún", ha: "Ƙara", ig: "Tinye", wo: "Yokk", ln: "Kobakisa", bm: "Fara", fon: "Kpɔ́n", ff: "Ɓeydude", dyu: "Fara", sef: "Fara", dje: "Tonton" },
  "Annuler": { en: "Cancel", ar: "إلغاء", yo: "Fagilé", ha: "Soke", ig: "Kagbuo", wo: "Bañ", ln: "Kobɔnga", bm: "Dabila", fon: "Gbɛ", ff: "Haɗtude", dyu: "Dabila", sef: "Dabila", dje: "Naŋ" },
  "Confirmer": { en: "Confirm", ar: "تأكيد", yo: "Ìjẹ́rìí", ha: "Tabbatar", ig: "Kwado", wo: "Dëggal", ln: "Kondima", bm: "Sɛmɛntiya", fon: "Hɛn-nyɔ́n", ff: "Tabitinde", dyu: "Sɛmɛntiya", sef: "Sɛbɛ", dje: "Tabbatandi" },
  "Enregistrer": { en: "Save", ar: "حفظ", yo: "Tọ́jú", ha: "Adana", ig: "Chekwaa", wo: "Denc", ln: "Kobomba", bm: "Mara", fon: "Hwɛn", ff: "Reende", dyu: "Mara", sef: "Mara", dje: "Gaay" },
  "Retour": { en: "Back", ar: "رجوع", yo: "Padà", ha: "Koma", ig: "Laghachi", wo: "Dellu", ln: "Kozonga", bm: "Segin", fon: "Lɛ́ kɔ", ff: "Artude", dyu: "Segin", sef: "Segin", dje: "Yeti" },
  "Suivant": { en: "Next", ar: "التالي", yo: "Ọ̀tẹ̀le", ha: "Na gaba", ig: "Ọzọ", wo: "Ci kanam", ln: "Oyo", bm: "Nata", fon: "Bo", ff: "Yeeso", dyu: "Nata", sef: "Nata", dje: "Banda" },
  "Précédent": { en: "Previous", ar: "السابق", yo: "Tẹ́lẹ̀", ha: "Da", ig: "Ụzọ ahụ", wo: "Bu jiitu", ln: "Liboso", bm: "Kɔrɔ", fon: "Yìbǒ", ff: "Adan", dyu: "Kɔrɔ", sef: "Kɔrɔ", dje: "Jine" },
  "Continuer": { en: "Continue", ar: "متابعة", yo: "Tẹ̀síwájú", ha: "Cigaba", ig: "Gaa n'ihu", wo: "Wéy", ln: "Kokoba", bm: "Sira da", fon: "Yi nukɔn", ff: "Jokkude", dyu: "Sira da", sef: "Sira da", dje: "Banda" },
  "Voir plus": { en: "See more", ar: "عرض المزيد", yo: "Wo síi", ha: "Duba ƙari", ig: "Lee karịa", wo: "Gis bu yokk", ln: "Tala lisusu", bm: "Filɛ kɔrɔ", fon: "Kpɔ́n d'éji", ff: "Yiy ko ɓuri", dyu: "Filɛ kɔrɔ", sef: "Filɛ kɔrɔ", dje: "Guna kibawo" },
  "Fermer": { en: "Close", ar: "إغلاق", yo: "Pa dé", ha: "Rufe", ig: "Mechie", wo: "Tëj", ln: "Kokanga", bm: "Datugu", fon: "Sú", ff: "Uddude", dyu: "Datugu", sef: "Datugu", dje: "Daabu" },

  // Champs / labels
  "Email": { en: "Email", ar: "البريد الإلكتروني", yo: "Ímeèlì", ha: "Imel", ig: "Ozi-e", wo: "Imeel", ln: "Imeli", bm: "Imɛli", fon: "Imɛl", ff: "Imeel", dyu: "Imɛli", sef: "Imɛli", dje: "Imel" },
  "Téléphone": { en: "Phone", ar: "الهاتف", yo: "Tẹlifóònù", ha: "Wayar hannu", ig: "Ekwentị", wo: "Telefon", ln: "Telefoni", bm: "Telefɔni", fon: "Alɔkpa", ff: "Kaɓirgal", dyu: "Telefɔni", sef: "Telefɔni", dje: "Telefoŋ" },
  "Mot de passe": { en: "Password", ar: "كلمة المرور", yo: "Ọ̀rọ̀ ìṣínà", ha: "Kalmar wucewa", ig: "Okwu nzuzo", wo: "Baatu lëkkalookat", ln: "Liloba ya nkuku", bm: "Tɛmɛ daɲɛ", fon: "Xógbè", ff: "Konngol jaltirgol", dyu: "Tɛmɛ daɲɛ", sef: "Tɛmɛ daɲɛ", dje: "Doŋkay sanniyaŋ" },
  "Nom": { en: "Name", ar: "الاسم", yo: "Orúkọ", ha: "Suna", ig: "Aha", wo: "Tur", ln: "Nkombo", bm: "Tɔgɔ", fon: "Nyíkɔ́", ff: "Innde", dyu: "Tɔgɔ", sef: "Toon", dje: "Maa" },
  "Adresse": { en: "Address", ar: "العنوان", yo: "Àdírẹ́sì", ha: "Adireshi", ig: "Adreesị", wo: "Adrees", ln: "Esika", bm: "Sigida", fon: "Nɔtɛn", ff: "Ñiiɓirde", dyu: "Sigida", sef: "Sigida", dje: "Nungu" },
  "Ville": { en: "City", ar: "المدينة", yo: "Ìlú", ha: "Gari", ig: "Obodo", wo: "Dëkk", ln: "Engumba", bm: "Dugu", fon: "Tò", ff: "Wuro", dyu: "Dugu", sef: "Tin", dje: "Birni" },
  "Pays": { en: "Country", ar: "البلد", yo: "Orílẹ̀-èdè", ha: "Ƙasa", ig: "Mba", wo: "Réew", ln: "Ekólo", bm: "Jamana", fon: "Tò", ff: "Leydi", dyu: "Jamana", sef: "Wuro", dje: "Laabu" },

  // Statuts
  "En cours": { en: "In progress", ar: "قيد التقدم", yo: "Ń lọ", ha: "Ana cikin", ig: "Na-aga", wo: "Ci ay sotti", ln: "Ezali kosalema", bm: "A bɛ kɛ la", fon: "Ɖò bléti", ff: "Hannde", dyu: "A bɛ kɛ la", sef: "A bɛ kɛ la", dje: "Goy ra" },
  "Terminé": { en: "Done", ar: "منتهي", yo: "Tì pari", ha: "An gama", ig: "Emechara", wo: "Jeex na", ln: "Esili", bm: "A banna", fon: "É vɔ̀", ff: "Timmii", dyu: "A banna", sef: "A banna", dje: "Ban" },
  "En attente": { en: "Pending", ar: "في الانتظار", yo: "Dúró", ha: "Jira", ig: "Na-eche", wo: "Ci jëkk", ln: "Tozali kozela", bm: "Ka kɔnɔ", fon: "Nɔ tɛ́", ff: "Sabbii", dyu: "Ka kɔnɔ", sef: "Ka kɔnɔ", dje: "Hangaŋ" },
  "Vérifié": { en: "Verified", ar: "تم التحقق", yo: "Tì jẹ́rìí", ha: "An tabbatar", ig: "A kwadoro", wo: "Dëggu", ln: "Endimami", bm: "Sɛmɛntiyalen", fon: "É hɛn-nyɔ́n", ff: "Tabitinaa", dyu: "Sɛmɛntiyalen", sef: "Sɛmɛntiyalen", dje: "Tabbatandi" },

  // Wallet / paiements
  "Solde": { en: "Balance", ar: "الرصيد", yo: "Ìyókù", ha: "Ma'auni", ig: "Nguzo", wo: "Bii baalu", ln: "Mbɔngɔ", bm: "Wari mara", fon: "Akwɛ́ ɖò bɔ̀", ff: "Dañal", dyu: "Wari mara", sef: "Wari", dje: "Noru" },
  "Recharger": { en: "Top up", ar: "شحن", yo: "Fi ṣàfikún", ha: "Cika", ig: "Mejupụta", wo: "Yokk", ln: "Kobakisa", bm: "Dafa", fon: "Sɔ́ d'éji", ff: "Hawritinde", dyu: "Dafa", sef: "Dafa", dje: "Tonton" },
  "Retirer": { en: "Withdraw", ar: "سحب", yo: "Yọ jáde", ha: "Cire", ig: "Wepụ", wo: "Génne", ln: "Kobima", bm: "Bɔ", fon: "Yí síngɔ", ff: "Yaltinde", dyu: "Bɔ", sef: "Bɔ", dje: "Kaa" },
  "Payer": { en: "Pay", ar: "ادفع", yo: "San", ha: "Biya", ig: "Kwụọ", wo: "Fey", ln: "Kofuta", bm: "Sara", fon: "Sú akwɛ́", ff: "Yobaade", dyu: "Sara", sef: "Sara", dje: "Bana" },
  "Total": { en: "Total", ar: "المجموع", yo: "Àpapọ̀", ha: "Jimla", ig: "Mkpokọta", wo: "Mbooloo", ln: "Mobimba", bm: "Bɛɛ", fon: "Bǐ", ff: "Hawtii", dyu: "Bɛɛ", sef: "Bɛɛ", dje: "Kul" },

  // Common UI
  "Oui": { en: "Yes", ar: "نعم", yo: "Bẹ́ẹ̀ni", ha: "Eh", ig: "Ee", wo: "Waaw", ln: "Ee", bm: "Ɔwɔ", fon: "Ɛɛn", ff: "Eey", dyu: "Ɔwɔ", sef: "Awɔ", dje: "Hii" },
  "Non": { en: "No", ar: "لا", yo: "Rárá", ha: "A'a", ig: "Mba", wo: "Déedéet", ln: "Te", bm: "Ayi", fon: "Eǒ", ff: "Alaa", dyu: "Ayi", sef: "Ayi", dje: "Aabu" },
  "Bienvenue": { en: "Welcome", ar: "مرحباً", yo: "Káàbọ̀", ha: "Barka da zuwa", ig: "Nnọọ", wo: "Dalal ak diam", ln: "Boyei bolamu", bm: "I bisimila", fon: "Mì kú", ff: "A jaaraama", dyu: "I ni se", sef: "I bisimila", dje: "Aniize" },
  "Merci": { en: "Thank you", ar: "شكراً", yo: "O ṣé", ha: "Na gode", ig: "Daalụ", wo: "Jërejëf", ln: "Matɔndi", bm: "I ni ce", fon: "Awǎnǔ", ff: "A jaaraama", dyu: "I ni ce", sef: "I ni ce", dje: "Fofo" },
  "Chargement": { en: "Loading", ar: "جار التحميل", yo: "Ó ń gbé", ha: "Ana ɗauka", ig: "Na-ebu", wo: "Ay yaag", ln: "Kotonda", bm: "A bɛ ta la", fon: "Ɖò sɔ́ wɛ", ff: "Ina rufa", dyu: "A bɛ ta la", sef: "A bɛ ta la", dje: "Sambu ra" },
  "Erreur": { en: "Error", ar: "خطأ", yo: "Àṣìṣe", ha: "Kuskure", ig: "Njehie", wo: "Njuumte", ln: "Libungi", bm: "Filɛnnin", fon: "Núwiwa agɔ", ff: "Juumre", dyu: "Filɛnnin", sef: "Filɛnnin", dje: "Sasu" },
};

/** Recherche dans le dictionnaire. Retourne null si la traduction n'existe pas. */
export function lookupDict(text: string, code: string): string | null {
  const trimmed = text.trim();
  const entry = DICTIONARY[trimmed];
  if (!entry) return null;
  return (entry as Record<string, string>)[code] ?? null;
}
