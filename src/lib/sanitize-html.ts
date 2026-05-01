import DOMPurify from "dompurify";

/**
 * Sanitize HTML produced by the rich-text editor before rendering or saving.
 * Strips scripts, event handlers, and unsafe URI schemes.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "blockquote",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li",
      "a", "img", "code", "pre", "hr",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
