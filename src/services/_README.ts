/**
 * @folder  src/services
 * @what    Business logic layer — all Prisma queries live here, not in API routes
 * @purpose Thin API routes delegate to services; services own validation + DB calls
 * @rules   NEVER add HTTP logic (NextResponse, Request) here. NEVER import from app/ here.
 * @layer   services
 * @ai      If you need to add a DB query, add it to the appropriate service file, not to a route.
 *
 * Files:
 *   user.service.ts          — listUsers, createUser (uniqueness checks for email/cpf/phone)
 *   communication.service.ts — getAllCommunications (no company filter), getPinned, getRecent, CRUD
 *   folder.service.ts        — listFolders, createFolder, createRootFolder, renameFolder, deleteFolder
 *   file.service.ts          — validateFile, listFiles, uploadFile (Supabase), getFileById, deleteFile, downloadFile
 */
export {};
