import { useState } from "react";

export default function App() {
  const [word, setWord] = useState("");
  const [wordData, setWordData] = useState(null);
  const [translated, setTranslated] = useState(false);

  async function fetchWordData() {
    if (!word.trim()) return alert("Please enter a word!");

    setWordData(null);
    setTranslated(false);

    const dictionaryAPI = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    try {
      // Kelimenin anlamlarını ve örnek cümlelerini al
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
            .filter((example) => example) // Boş olanları filtrele
        )
        .flat() || [];

      const exampleSentences = examples.slice(0, 5); // En fazla 5 örnek al

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
    const translateAPI = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tr`;
    const res = await fetch(translateAPI);
    const data = await res.json();
    return data.responseData.translatedText;
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
        </div>
      )}
    </div>
  );
}
