const OpenAI = require("openai");
const {defineSecret} = require("firebase-functions/params");

// ✅ Define secret (new way)
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

const checkAnswersWithAI = async (req, res) => {
  // ---- CORS ----
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  try {
    const body = req.body || {};
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({error: "Invalid payload"});
    }

    // ✅ Create OpenAI client INSIDE handler
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY.value(),
    });

    /* ---------- PROMPT ---------- */

    let questionsBlock = "";
    items.forEach((q, i) => {
      questionsBlock +=
          "Question " + (i + 1) + ":\n" +
          q.question_text + "\n\n" +
          "Teacher Answer:\n" +
          q.teacher_answer + "\n\n";
    });

    const systemPrompt =
        "You are a school-level mathematics evaluator.\n\n" +
        "Rules:\n" +
        "- Solve each question independently.\n" +
        "- Compute the correct answer.\n" +
        "- Compare with the teacher answer.\n" +
        "- Return ONLY valid JSON.\n";

    const userPrompt =
        questionsBlock +
        "\nReturn JSON in this format:\n\n" +
        "{\n" +
        "  \"results\": [\n" +
        "    {\n" +
        "      \"ai_answer\": \"string or number\",\n" +
        "      \"agrees\": true | false,\n" +
        "      \"reasoning\": \"short explanation\"\n" +
        "    }\n" +
        "  ]\n" +
        "}\n";

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      console.error(
          "AI raw output:",
          completion.choices[0].message.content,
      );
      return res.status(500).json({error: "Invalid AI JSON response"});
    }

    const results = parsed.results.map((r, idx) => {
      return {
        question_id: items[idx].question_id,
        teacher_answer: items[idx].teacher_answer,
        ai_answer: r.ai_answer,
        agrees: r.agrees,
        reasoning: r.reasoning || "",
      };
    });

    return res.json({results});
  } catch (err) {
    console.error("checkAnswersWithAI error:", err);
    return res.status(500).json({error: "Internal server error"});
  }
};

module.exports = checkAnswersWithAI;
