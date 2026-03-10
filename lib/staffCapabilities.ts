type Service = { _id: string; name: string; category: string };
type Staff = { firstName: string; serviceIds?: { _id: string }[] };

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isServiceForSevim(service: Service) {
  const category = normalizeText(service.category || "");
  const name = normalizeText(service.name || "");
  const isColorService =
    name.includes("farb") ||
    name.includes("color") ||
    name.includes("gloss") ||
    name.includes("strah") ||
    name.includes("balayage") ||
    name.includes("milkshake") ||
    name.includes("face frame");
  return category === "men" || isColorService;
}

export function canStaffDoAllServices(staff: Staff, services: Service[]) {
  const firstName = normalizeText(staff.firstName || "");
  return services.every((service) => {
    if (firstName === "sevim") return isServiceForSevim(service);
    if (firstName === "maria") return normalizeText(service.category || "") === "women";
    if (["sarah", "mehtap", "masoud", "kanj"].includes(firstName)) return true;
    return (staff.serviceIds || []).some((sv) => String(sv._id) === String(service._id));
  });
}
