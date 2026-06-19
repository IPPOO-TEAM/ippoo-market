export type Address = {
  id: string;
  label: string;
  details: string;
  type: "delivery" | "billing";
  isDefault: boolean;
};

export type Doc = {
  id: string;
  label: string;
  status: "verified" | "pending" | "missing";
};

export type TeamMember = { id: string; name: string; email: string; role: string };
