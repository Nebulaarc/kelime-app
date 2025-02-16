import { useState } from "react";

export default function App() {
  const [word, setWord] = useState("");
  const [wordData, setWordData] = useState(null);
  const [translated, setTranslated] = useState(false);
  const [userNote, setUserNote] = useState("");
  const [audioSrc, setAudioSrc] = useState(null);

  async function fetchWordData() {
    if (!word.trim()) return alert("Please enter a word!");

    setWordData(null);
    setTranslated(false);
    setUserNote("");

    const dictionaryAPI = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    try {
      // Dictionary API'den anlam ve ses dosyasını al
      const dictRes = await fetch(dictionaryAPI);
      const dictData = await dictRes.json();

      if (!dictData || dictData.length === 0) {
        alert("Word not found.");
        return;
      }

      // Tüm anlamları listele
      const meanings = dictData[0]?.meanings.map((meaning) =>
        meaning.definitions.map((def) => def.definition)
      ).flat() || [];

      // Tüm örnek cümleleri al ve 5 taneye kadar sınırla
      const examples = dictData[0]?.meanings
        .map((meaning) =>
          meaning.definitions
            .map((def) => def.example)
            .filter((example) => example)
        )
        .flat() || [];

      const exampleSentences = examples.slice(0, 5);

      // Sesli telaffuz URL'sini al (Eğer varsa)
      const phonetics = dictData[0]?.phonetics?.find((p) => p.audio);
      setAudioSrc(phonetics ? phonetics.audio : null);

      setWordData({
        word,
        meanings,
        exampleSentences
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error fetching data. Please try another word.");
    }
  }

  async function translateText(text) {
    const googleTranslateAPI = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(googleTranslateAPI);
    const data = await res.json();
    return data[0]?.[0]?.[0] || "Translation not available.";
  }

  async function showTranslationHandler() {
    if (wordData) {
      const translatedMeanings = await Promise.all(
        wordData.meanings.map((meaning) => translateText(meaning))
      );
      const translatedExamples = await Promise.all(
        wordData.exampleSentences.map((example) => translateText(example))
      );

      setWordData({
        ...wordData,
        meanings: translatedMeanings,
        exampleSentences: translatedExamples
      });

      setTranslated(true);
    }
  }

  function saveNote() {
    if (!userNote.trim()) return;
    localStorage.setItem(`note-${word}`, userNote);
    alert("Your note has been saved!");
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold">Vocabulary Card Generator</h1>
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        className="p-2 border border-gray-300 rounded-md w-64"
        placeholder="Enter a word"
      />
      <button
        onClick={fetchWordData}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Generate Card
      </button>

      {wordData && (
        <div
          className="bg-white shadow-lg rounded-lg p-4 w-96 text-center mt-6 cursor-pointer"
          onClick={() =>
            translated ? setTranslated(false) : showTranslationHandler()
          }
        >
          <h2 className="text-xl font-bold">{wordData.word}</h2>

          {/* 🔊 Sesli Telaffuz Butonu */}
          {audioSrc && (
            <button
              onClick={() => new Audio(audioSrc).play()}
              className="mt-2 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              🔊 Play Pronunciation
            </button>
          )}

          <div className="mt-2 text-left">
            <h3 className="font-semibold">{translated ? "Türkçe Anlamlar" : "Meanings"}</h3>
            <ul className="list-disc list-inside">
              {wordData.meanings.map((meaning, index) => (
                <li key={index}>{meaning}</li>
              ))}
            </ul>
          </div>

          <div className="mt-2 text-left">
            <h3 className="font-semibold">{translated ? "Türkçe Örnek Cümleler" : "Example Sentences"}</h3>
            <ul className="list-disc list-inside">
              {wordData.exampleSentences.length > 0 ? (
                wordData.exampleSentences.map((example, index) => (
                  <li key={index} className="italic">"{example}"</li>
                ))
              ) : (
                <li className="italic">No examples found.</li>
              )}
            </ul>
          </div>

          {/* 📝 Kullanıcı Notu Ekleme */}
          <textarea
            className="mt-2 p-2 w-full border rounded-md"
            placeholder="Add your own notes..."
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
          ></textarea>
          <button
            onClick={saveNote}
            className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            Save Note
          </button>
        </div>
      )}
    </div>
  );
}
