export type CommandCategory = "quick-action" | "agent-command" | "navigation";

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  shortcut?: string;
  icon?: string;
  keywords?: string[];
  disabled?: boolean;
  perform: () => void | Promise<void>;
}

export interface CommandGroup {
  category: CommandCategory;
  label: string;
  items: CommandItem[];
}
