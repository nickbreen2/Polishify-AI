import {
  polishText,
  getClarifyingQuestions,
  improveWithContext,
} from "@/lib/api";
import type {
  PolishMode,
  PolishRequest,
  PolishResponse,
  PolishError,
  TriggerPolish,
  ClarifyRequest,
  ClarifyResponse,
  ClarifyError,
  ImproveRequest,
  ImproveResponse,
  ImproveError,
} from "@/lib/types";

export default defineBackground(() => {
  // Context menu
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: "polish-selection",
      title: "Polish with AI",
      contexts: ["selection"],
    });
  });

  // Context menu click handler
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "polish-selection" && tab?.id) {
      browser.tabs.sendMessage(tab.id, {
        type: "TRIGGER_POLISH",
      } satisfies TriggerPolish);
    }
  });

  // Keyboard shortcut handler
  browser.commands.onCommand.addListener((command) => {
    if (command === "open-popup") {
      browser.action.openPopup();
      return;
    }
    if (command === "polish-selection") {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          browser.tabs.sendMessage(tab.id, {
            type: "TRIGGER_POLISH",
          } satisfies TriggerPolish);
        }
      });
    }
  });

  type Message =
    | PolishRequest
    | ClarifyRequest
    | ImproveRequest;
  type Response =
    | PolishResponse
    | PolishError
    | ClarifyResponse
    | ClarifyError
    | ImproveResponse
    | ImproveError;

  // Message handler — relay API calls from content script / popup
  browser.runtime.onMessage.addListener(
    (
      message: Message,
      _sender: browser.runtime.MessageSender,
      sendResponse: (response: Response) => void
    ) => {
      if (message.type === "POLISH_REQUEST") {
        (async () => {
          const mode =
            ((await browser.storage.local.get("mode")).mode as PolishMode) ??
            "general";

          try {
            const result = await polishText(message.text, mode);
            sendResponse({
              type: "POLISH_RESPONSE",
              improvedText: result.improvedText,
            });
          } catch (err) {
            sendResponse({
              type: "POLISH_ERROR",
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        })();
        return true;
      }

      if (message.type === "CLARIFY_REQUEST") {
        (async () => {
          try {
            const result = await getClarifyingQuestions(
              message.text,
              message.polishedText
            );
            sendResponse({
              type: "CLARIFY_RESPONSE",
              questions: result.questions,
            });
          } catch (err) {
            sendResponse({
              type: "CLARIFY_ERROR",
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        })();
        return true;
      }

      if (message.type === "IMPROVE_REQUEST") {
        (async () => {
          try {
            const result = await improveWithContext(
              message.text,
              message.mode,
              message.answers,
              message.polishedText
            );
            sendResponse({
              type: "IMPROVE_RESPONSE",
              improvedText: result.improvedText,
            });
          } catch (err) {
            sendResponse({
              type: "IMPROVE_ERROR",
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        })();
        return true;
      }
    }
  );
});
