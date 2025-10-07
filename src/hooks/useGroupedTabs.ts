import { useMemo } from 'react';
import { TabAccess } from './useTabsAccess';

export interface GroupedTab extends TabAccess {
  children: TabAccess[];
}

export function useGroupedTabs(tabs: TabAccess[]) {
  return useMemo(() => {
    const groups: Record<string, GroupedTab> = {};
    
    // First pass: Create all groups (items without parent_key)
    tabs.forEach(tab => {
      if (!tab.parent_key) {
        groups[tab.key] = { ...tab, children: [] };
      }
    });
    
    // Second pass: Add children to their respective groups
    tabs.forEach(tab => {
      if (tab.parent_key && groups[tab.parent_key]) {
        groups[tab.parent_key].children.push(tab);
      }
    });
    
    // Sort children within each group
    Object.values(groups).forEach(group => {
      group.children.sort((a, b) => a.sort_order - b.sort_order);
    });
    
    // Return sorted array of groups
    return Object.values(groups).sort((a, b) => a.sort_order - b.sort_order);
  }, [tabs]);
}
