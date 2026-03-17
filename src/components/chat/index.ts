/**
 * Chat module — barrel export for all chat-related components and utilities.
 */

export { ChatSidebar } from './ChatSidebar';
export { ChatFilePreviewModal } from './ChatFilePreviewModal';
export { KnowledgeBasePanel } from './KnowledgeBasePanel';
export { renderToolPart, isToolPart } from './tool-registry';
export {
  // Utilities
  getAuthToken,
  stripSystemInstructions,
  getChatFileIcon,
  getFileExtension,
  formatChatFileSize,
  getFileChipColor,
  getProcessType,
  getToolTitle,
  getChatColors,
  // Constants
  API_BASE_URL_CHAT,
  // Types
  type ChatPreviewFile,
  type ChatColors,
} from './chat-utils';
