/**
 * @context FormError.tsx
 * @what    Styled inline error alert for forms
 * @purpose Avoid repeating the same red-box error paragraph in every form
 * @depends Nothing
 * @usedby  NewUserPage, UploadContent, NewCommunicationPage
 * @rules   Renders nothing when message is falsy — safe to always include
 * @layer   component
 */
export default function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
      {message}
    </p>
  );
}
