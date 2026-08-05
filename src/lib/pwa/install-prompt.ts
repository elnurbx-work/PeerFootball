export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export async function requestPwaInstall(
  promptEvent: BeforeInstallPromptEvent | null
): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!promptEvent) return "unavailable";

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  return choice.outcome;
}
