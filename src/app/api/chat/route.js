// app/api/chat/route.js

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Keine Nachricht übergeben." }, { status: 400 });
    }

    const response = await fetch("https://api-inference.huggingface.co/models/gpt2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: message }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Fehler von Hugging Face:", result);
      return NextResponse.json(
        { error: "Fehler bei der Anfrage an das KI-Modell", details: result },
        { status: 500 }
      );
    }

    // GPT2 gibt ein Array mit generated_text zurück
    const reply = Array.isArray(result) && result[0]?.generated_text
      ? result[0].generated_text
      : "Keine Antwort generiert.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Serverfehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", details: error.message },
      { status: 500 }
    );
  }
}
