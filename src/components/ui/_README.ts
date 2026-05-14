/**
 * @folder  src/components/ui
 * @what    Reusable React UI components shared across pages
 * @purpose Avoid duplicating UI patterns; keep pages thin and readable
 * @rules   "use client" only when strictly necessary. No Prisma here. No direct fetch to DB.
 * @layer   components
 * @ai      Before creating a new component, check if the pattern already exists here.
 *
 * Files:
 *   Sidebar.tsx             — App shell sidebar with nav links and user info (client)
 *   FolderTree.tsx          — Recursive folder tree for the Files page sidebar (client)
 *   FileCard.tsx            — File card with download link and delete (uses ConfirmDeleteButton)
 *   CommunicationCard.tsx   — Communication card with pin/delete (uses ConfirmDeleteButton)
 *   CreateFolderForm.tsx    — Inline form to create a subfolder (client)
 *   CreateSectorButton.tsx  — Modal button to create a root sector (client, admin/manager only)
 *   ConfirmDeleteButton.tsx — Two-step delete button shared by FileCard and CommunicationCard
 *   FormError.tsx           — Inline red error alert for forms (renders null when no message)
 */
export {};
