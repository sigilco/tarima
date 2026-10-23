/**
 * Binding storage seam.
 *
 * The bot needs to know two things: which project a chat is bound to
 * (to answer `/status` and to target digest pushes) and which chats are
 * bound to a project (to fan out digest notifications). Both directions
 * live behind this interface so the package stays free of db code: the
 * api binds it to sqlite, tests bind it to the in-memory implementation.
 */
export interface BindingStore {
  /** Bind (or rebind) a chat to a project. */
  set(chatId: number, projectId: string): void;
  /** The project a chat is bound to, or undefined when it is not bound. */
  get(chatId: number): string | undefined;
  /** Drop a chat's binding; unbinding an unbound chat is a no-op. */
  remove(chatId: number): void;
  /** Every chat id bound to a project, for digest fan-out. */
  listForProject(projectId: string): number[];
}

/** In-memory `BindingStore`; the unit tests and local dev default. */
export class MemoryBindingStore implements BindingStore {
  private readonly chatToProject = new Map<number, string>();
  private readonly projectToChats = new Map<string, Set<number>>();

  set(chatId: number, projectId: string): void {
    // Rebinding a chat first drops the old project's index entry, so a
    // chat can never appear in two projects' chat lists at once.
    const previous = this.chatToProject.get(chatId);
    if (previous !== undefined && previous !== projectId) {
      this.projectToChats.get(previous)?.delete(chatId);
    }
    this.chatToProject.set(chatId, projectId);
    let chats = this.projectToChats.get(projectId);
    if (!chats) {
      chats = new Set();
      this.projectToChats.set(projectId, chats);
    }
    chats.add(chatId);
  }

  get(chatId: number): string | undefined {
    return this.chatToProject.get(chatId);
  }

  remove(chatId: number): void {
    const projectId = this.chatToProject.get(chatId);
    if (projectId === undefined) return;
    this.chatToProject.delete(chatId);
    this.projectToChats.get(projectId)?.delete(chatId);
  }

  listForProject(projectId: string): number[] {
    return [...(this.projectToChats.get(projectId) ?? [])];
  }
}
