const REPLY_TEMPLATES = {
  english: {
    open: [
      "Sure, opening {target}.",
      "Yep, opening {target}.",
      "On it, opening {target}.",
      "Got it, opening {target}.",
      "{target} is coming up.",
    ],
    multiOpen: [
      "Sure, opening {targets}.",
      "Yep, opening {targets}.",
      "On it, opening {targets}.",
      "Got it, pulling up {targets}.",
    ],
    search: [
      "Sure, looking up {query}.",
      "Yep, searching for {query}.",
      "On it, searching {site} for {query}.",
      "Got it, pulling up {query}.",
    ],
    play: [
      "Nice, playing {topic}.",
      "Yep, playing {topic}.",
      "On it, playing {topic}.",
      "Good pick, playing {topic}.",
    ],
    find: [
      "Sure, finding {topic}.",
      "Yep, pulling up {topic}.",
      "On it, finding {topic}.",
    ],
    guide: [
      "Sure, I will walk you through {target}.",
      "Yep, starting a quick walkthrough of {target}.",
      "On it, I will guide you through {target}.",
    ],
    locate: [
      "Sure, I will point out {target}.",
      "Yep, I will show you where {target} is.",
      "On it, I will point to {target}.",
    ],
    located: [
      "There it is, I pointed to {target}.",
      "Found it, I pointed to {target}.",
      "Yep, that is {target}.",
    ],
    cursorColor: [
      "Sure, switching the cursor to {color}.",
      "Yep, making it {color}.",
      "Got it, cursor is {color} now.",
      "On it, changing the cursor to {color}.",
    ],
    webSearchStart: [
      "Okay, give me a few seconds. I’ll check the web for that.",
      "Sure, let me look through the internet for a moment.",
      "On it. I’ll search the web and pull together what looks reliable.",
      "Got it. Give me a moment while I check current sources.",
    ],
    unsupported: [
      "I heard you, but I cannot do that one yet.",
      "I got that, but that command is not ready yet.",
      "I heard you. I just do not know how to handle that one yet.",
    ],
    notFound: [
      "I could not spot {target} clearly. Keep it visible and ask me again.",
      "I cannot see {target} clearly yet. Bring it into view and try again.",
    ],
  },
  hindi: {
    open: ["ठीक है, {target} खोल रही हूँ.", "हाँ, {target} खोल रही हूँ.", "बस, {target} आ रहा है."],
    multiOpen: ["ठीक है, {targets} खोल रही हूँ.", "हाँ, {targets} खोल देती हूँ."],
    search: ["ठीक है, {query} ढूँढ रही हूँ.", "हाँ, {query} सर्च कर रही हूँ."],
    play: ["ठीक है, {topic} चला रही हूँ.", "हाँ, {topic} प्ले कर रही हूँ."],
    find: ["ठीक है, {topic} ढूँढ रही हूँ.", "हाँ, {topic} निकाल रही हूँ."],
    guide: ["ठीक है, मैं {target} समझा देती हूँ.", "हाँ, {target} का छोटा walkthrough शुरू करती हूँ."],
    locate: ["ठीक है, मैं {target} दिखा देती हूँ.", "हाँ, {target} कहाँ है दिखाती हूँ."],
    located: ["मिल गया, मैंने {target} दिखा दिया.", "हाँ, यही {target} है."],
    cursorColor: ["ठीक है, cursor को {color} कर रही हूँ.", "हाँ, cursor अब {color} है."],
    webSearchStart: ["ठीक है, कुछ सेकंड दो. मैं web पर check करती हूँ.", "हाँ, मैं internet से reliable info देखती हूँ."],
    unsupported: ["मैंने सुना, पर ये command अभी ready नहीं है.", "समझ गई, पर ये वाला काम अभी नहीं कर सकती."],
    notFound: ["मैं {target} साफ़ नहीं देख पा रही. इसे screen पर रखो और फिर बोलो."],
  },
  urdu: {
    open: ["ٹھیک ہے، {target} کھول رہی ہوں.", "جی، {target} کھول دیتی ہوں.", "بس، {target} آ رہا ہے."],
    multiOpen: ["ٹھیک ہے، {targets} کھول رہی ہوں.", "جی، {targets} کھول دیتی ہوں."],
    search: ["ٹھیک ہے، {query} ڈھونڈ رہی ہوں.", "جی، {query} سرچ کر رہی ہوں."],
    play: ["ٹھیک ہے، {topic} چلا رہی ہوں.", "جی، {topic} پلے کر رہی ہوں."],
    find: ["ٹھیک ہے، {topic} ڈھونڈ رہی ہوں.", "جی، {topic} نکال رہی ہوں."],
    guide: ["ٹھیک ہے، میں {target} سمجھا دیتی ہوں.", "جی، {target} کا چھوٹا walkthrough شروع کرتی ہوں."],
    locate: ["ٹھیک ہے، میں {target} دکھا دیتی ہوں.", "جی، {target} کہاں ہے دکھاتی ہوں."],
    located: ["مل گیا، میں نے {target} دکھا دیا.", "جی، یہی {target} ہے."],
    cursorColor: ["ٹھیک ہے، cursor کو {color} کر رہی ہوں.", "جی، cursor اب {color} ہے."],
    webSearchStart: ["ٹھیک ہے، چند سیکنڈ دیں. میں web پر check کرتی ہوں.", "جی، میں internet سے reliable info دیکھتی ہوں."],
    unsupported: ["میں نے سنا، مگر یہ command ابھی ready نہیں ہے.", "سمجھ گئی، مگر یہ کام ابھی نہیں کر سکتی."],
    notFound: ["میں {target} صاف نہیں دیکھ پا رہی. اسے screen پر رکھیں اور دوبارہ بولیں."],
  },
  hinglish: {
    open: ["Sure, {target} khol rahi hoon.", "Haan, {target} open kar rahi hoon.", "Done, {target} aa raha hai."],
    multiOpen: ["Sure, {targets} khol rahi hoon.", "Haan, {targets} open kar deti hoon."],
    search: ["Sure, {query} search kar rahi hoon.", "Haan, {query} dekh rahi hoon."],
    play: ["Nice, {topic} chala rahi hoon.", "Haan, {topic} play kar rahi hoon."],
    find: ["Sure, {topic} dhoond rahi hoon.", "Haan, {topic} nikaal rahi hoon."],
    guide: ["Sure, main {target} explain kar deti hoon.", "Haan, {target} ka quick walkthrough start karti hoon."],
    locate: ["Sure, main {target} point kar deti hoon.", "Haan, {target} kahan hai dikhaati hoon."],
    located: ["Mil gaya, maine {target} point kar diya.", "Yep, yehi {target} hai."],
    cursorColor: ["Sure, cursor ko {color} kar rahi hoon.", "Haan, cursor ab {color} hai."],
    webSearchStart: ["Okay, kuch seconds do. Main web check karti hoon.", "Sure, main internet se reliable info dekh leti hoon."],
    unsupported: ["Maine suna, but ye command abhi ready nahi hai.", "Samajh gayi, but ye wala kaam abhi nahi kar sakti."],
    notFound: ["Main {target} clearly nahi dekh pa rahi. Screen par rakho aur phir bolo."],
  },
};

function buildReply(type, values = {}, language = "english") {
  const templatesByLanguage = REPLY_TEMPLATES[language] || REPLY_TEMPLATES.english;
  const templates = templatesByLanguage[type] || REPLY_TEMPLATES.english[type] || REPLY_TEMPLATES.english.unsupported;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/\{(\w+)\}/g, (_match, key) => cleanValue(values[key]));
}

function formatList(items, language = "english") {
  const cleanItems = items.map(cleanValue).filter(Boolean);
  if (cleanItems.length <= 2) {
    return cleanItems.join(getListJoiner(language));
  }

  return `${cleanItems.slice(0, -1).join(", ")}${getListJoiner(language)}${cleanItems[cleanItems.length - 1]}`;
}

function cleanValue(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getListJoiner(language) {
  if (language === "hindi") {
    return " और ";
  }
  if (language === "urdu") {
    return " اور ";
  }
  if (language === "hinglish") {
    return " aur ";
  }
  return " and ";
}

module.exports = {
  buildReply,
  formatList,
};
