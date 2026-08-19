export type ManualPreflightDisplayInput = {
  ready: boolean;
  executionArmed: boolean;
};

export function getManualPreflightStatusModel({ ready, executionArmed }: ManualPreflightDisplayInput) {
  return {
    label: ready ? "READY FOR MANUAL TEST" : "BLOCKED · REVIEW CHECKS",
    tone: ready ? "ready" as const : "blocked" as const,
    executionLabel: executionArmed ? "YES · LIVE CONTROL ACTIVE" : "NO · SIMULATION_ONLY",
  };
}

export function getManualPreflightCheckLabel(passed: boolean) {
  return passed ? "PASS" : "FAIL";
}
