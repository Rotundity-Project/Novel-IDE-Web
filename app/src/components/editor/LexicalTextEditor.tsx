"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { EditorState } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

export function LexicalTextEditor(props: {
  initialText: string;
  onChangeText: (text: string) => void;
}) {
  const initialConfig = {
    namespace: "novel-ide-web",
    onError: (error: Error) => {
      throw error;
    },
    editorState: () => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(props.initialText));
      root.append(paragraph);
    },
  };

  function onChange(editorState: EditorState) {
    const text = editorState.read(() => $getRoot().getTextContent());
    props.onChangeText(text);
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            style={{
              minHeight: 380,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
            }}
          />
        }
        placeholder={<div style={{ opacity: 0.6, padding: 12 }}>开始写作...</div>}
        ErrorBoundary={({ children }) => <>{children}</>}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={onChange} />
    </LexicalComposer>
  );
}

