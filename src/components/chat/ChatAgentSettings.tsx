/**
 * DEPRECATED — ChatAgentSettings has been absorbed into YangSettingsPanel.
 *
 * Kept as a thin compatibility shim so any stray imports resolve to the new
 * component.  Delete this file once all call sites have been migrated.
 */

export { YangSettingsPanel as ChatAgentSettings } from './YangSettingsPanel';
export default function () {
  throw new Error(
    'ChatAgentSettings has been removed. Use YangSettingsPanel from @/components/chat instead.',
  );
}
