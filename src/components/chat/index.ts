/**
 * Chat module — barrel export for all chat-related components and utilities.
 */

export { ChatSidebar } from './ChatSidebar';
export { ChatFilePreviewModal } from './ChatFilePreviewModal';
export { KnowledgeBasePanel } from './KnowledgeBasePanel';
export { renderToolPart, isToolPart } from './tool-registry';
export { ChatModelSelector } from './ChatModelSelector';
export { ChatSkillSelector } from './ChatSkillSelector';
export { HTMLArtifactPreview } from './HTMLArtifactPreview';
export { InteractiveCodeSandbox } from './InteractiveCodeSandbox';

// ── YANG: advanced agentic features ─────────────────────────────────────────
export { YangSettingsPanel } from './YangSettingsPanel';
export type { YangSettingsPanelProps } from './YangSettingsPanel';
export { PlanModeBanner, YoloBanner } from './YangBanners';
export { FocusChainDrawer } from './FocusChainDrawer';
export { CheckpointsPanel } from './CheckpointsPanel';
export {
  CompletionVerificationBadge,
  CompactionBanner,
  TokenCounterBadge,
  ToolSearchChip,
  SubagentProgress,
  BackgroundTaskCard,
} from './YangInlineComponents';

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
