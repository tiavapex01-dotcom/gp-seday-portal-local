/**
 * @folder  src/schemas
 * @what    Zod v4 validation schemas for all API input shapes
 * @purpose Parse and transform request data before it reaches service functions
 * @rules   Import from "zod" (not "zod/v4"). No Prisma here. No async logic here.
 * @layer   schemas
 * @ai      Schema transforms run at parse-time. sanitizeDigits strips non-digits for cpf/phone.
 *          ZodError is caught in API routes via fromZodError() from lib/api.ts.
 *
 * Files:
 *   user.schema.ts          — createUserSchema (email/cpf/phone sanitization), listUsersSchema
 *   communication.schema.ts — createCommunicationSchema, updateCommunicationSchema (pin/publish only)
 *   folder.schema.ts        — createFolderSchema (needs parentId), createRootFolderSchema (needs company)
 *   file.schema.ts          — uploadFileSchema (folderId+description), listFilesSchema
 */
export {};
