export type ClaimDeviceEvent = {
  id: string;
  deviceId: string;
  serial: string;
  imei?: string;
  deviceCategory?: "Mobile" | "Laptop" | "Tablet";
  brand?: string;
  model?: string;
  deviceAge?: "< 6 months" | "6–12 months" | "> 12 months";
  insurer?: "Alpha Insurance" | "Beta Assurance" | "Gamma Cover";
  claimReference?: string;
  lossType?: "Theft" | "Accidental Damage" | "Loss" | "Fire" | "Water Damage";
  dateOfLoss?: string;
  claimAmount?: number;
  outcome?: "PAID_TOTAL_LOSS" | "PAID_PARTIAL" | "REJECTED";
  createdAtUtc: string;
};

const claimEvents: ClaimDeviceEvent[] = [];
const deviceBySerial = new Map<string, string>();
const usedClaimReferences = new Set<string>();

function formatPrefix(insurer?: string) {
  switch (insurer) {
    case "Alpha Insurance":
      return "ALPHA";
    case "Beta Assurance":
      return "BETA";
    case "Gamma Cover":
      return "GAMMA";
    default:
      return "CCT";
  }
}

function ensureUniqueClaimReference(
  preferred?: string,
  insurer?: string
) {
  const normalized = preferred?.trim();
  if (normalized && normalized.length > 0 && !usedClaimReferences.has(normalized)) {
    return normalized;
  }
  return generateClaimReference(insurer);
}

export function generateClaimReference(insurer?: string) {
  const prefix = formatPrefix(insurer);
  let candidate: string;
  do {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const suffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    candidate = `${prefix}-CLM-${timestamp}-${suffix}`;
  } while (usedClaimReferences.has(candidate));
  return candidate;
}

function registerClaimReference(reference: string) {
  usedClaimReferences.add(reference);
}

export function createClaimEvent(input: {
  deviceId: string;
  serial: string;
  imei?: string;
  deviceCategory?: "Mobile" | "Laptop" | "Tablet";
  brand?: string;
  model?: string;
  deviceAge?: "< 6 months" | "6–12 months" | "> 12 months";
  insurer?: "Alpha Insurance" | "Beta Assurance" | "Gamma Cover";
  claimReference?: string;
  lossType?: "Theft" | "Accidental Damage" | "Loss" | "Fire" | "Water Damage";
  dateOfLoss?: string;
  claimAmount?: number;
  outcome?: "PAID_TOTAL_LOSS" | "PAID_PARTIAL" | "REJECTED";
}): ClaimDeviceEvent {
  const claimReference = ensureUniqueClaimReference(
    input.claimReference,
    input.insurer
  );

  const event: ClaimDeviceEvent = {
    id: crypto.randomUUID(),
    deviceId: input.deviceId,
    serial: input.serial,
    imei: input.imei,
    deviceCategory: input.deviceCategory,
    brand: input.brand,
    model: input.model,
    deviceAge: input.deviceAge,
    insurer: input.insurer,
    claimReference,
    lossType: input.lossType,
    dateOfLoss: input.dateOfLoss,
    claimAmount: input.claimAmount,
    outcome: input.outcome,
    createdAtUtc: new Date().toISOString(),
  };
  claimEvents.unshift(event);
  registerClaimReference(claimReference);
  deviceBySerial.set(input.serial, input.deviceId);
  return event;
}

export function getClaimEvents(): ClaimDeviceEvent[] {
  return [...claimEvents];
}

export function getClaimEventsBySerial(serial: string): ClaimDeviceEvent[] {
  return claimEvents.filter((event) => event.serial === serial);
}

export function getClaimEventsGroupedBySerial(): Record<string, ClaimDeviceEvent[]> {
  return claimEvents.reduce<Record<string, ClaimDeviceEvent[]>>((acc, event) => {
    if (!acc[event.serial]) acc[event.serial] = [];
    acc[event.serial].push(event);
    return acc;
  }, {});
}

export function getDeviceIdBySerial(serial: string): string | null {
  return deviceBySerial.get(serial) ?? null;
}
