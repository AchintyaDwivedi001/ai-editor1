"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing…" })],
    content: "<p>Select text and click ✨ Edit with AI</p>",
    immediatelyRender: false, // fixes hydration error
  });

  async function handleAIEdit() {
    try {
      setErrorMessage("");
      if (!editor) {
        setErrorMessage("Editor not ready yet.");
        return;
      }

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");

      if (!selectedText || selectedText.trim() === "") {
        setErrorMessage("Please select some text first.");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: selectedText }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API error ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const reply = data?.summary ?? "";
      setAiSuggestion(reply || "No suggestion returned from AI.");
      setShowModal(true);
    } catch (err: any) {
      console.error("handleAIEdit error:", err);
      setErrorMessage(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  function confirmEdit() {
    if (!editor) {
      setErrorMessage("Editor not ready.");
      return;
    }
    const { from, to } = editor.state.selection;
    const tr = editor.state.tr;
    tr.insertText(aiSuggestion, from, to);
    editor.view.dispatch(tr);
    editor.commands.focus();
    setShowModal(false);
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 p-4 border-r">
        <h3 className="font-bold mb-2">Sidebar</h3>
        <p className="text-sm text-gray-600">Chat & tools</p>
      </aside>

      {/* Main editor */}
      <main className="flex-1 p-6">
        <div className="mb-2">
          {errorMessage && <div className="text-red-600 mb-2">{errorMessage}</div>}
          {loading && <div className="text-sm text-gray-500 mb-2">Calling AI...</div>}
        </div>

        {mounted && (
          <EditorContent
            editor={editor}
            className="border rounded-lg p-4 min-h-[400px]"
          />
        )}

        {editor && (
          <button
            onClick={handleAIEdit}
            className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-sm shadow"
          >
            ✨ Edit with AI
          </button>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
              <h4 className="font-semibold mb-2">AI Suggestion</h4>
              <div className="mb-4 whitespace-pre-wrap text-sm">{aiSuggestion}</div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEdit}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
