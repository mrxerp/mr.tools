/** Clipboard helpers with graceful fallback. */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to execCommand
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const exec = (document as unknown as { execCommand(cmd: string): boolean }).execCommand;
    const ok = exec("copy");
    el.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Copies text and flashes a "Copied" state on the button (best effort). */
export async function copyTextWithFeedback(
  text: string,
  button: HTMLButtonElement | null,
): Promise<void> {
  const ok = await copyText(text);
  if (!button) return;
  const label = button.textContent;
  button.textContent = ok ? "Copied" : "Copy failed";
  button.disabled = ok;
  setTimeout(() => {
    button.textContent = label;
    button.disabled = false;
  }, 1200);
}
