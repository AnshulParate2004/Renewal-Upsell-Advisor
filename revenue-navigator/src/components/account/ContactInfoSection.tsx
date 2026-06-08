import { useState } from "react";
import { Users, Mail, Phone, Building2, Edit2, Calendar } from "lucide-react";
import { useUpdateAccount } from "@/hooks/useAccounts";
import { accountCard, accountSectionTitle } from "./accountDetailStyles";
import type { Account } from "@/data/mockData";

function InfoCell({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-black/8 min-h-[52px]">
      {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground break-all">{value || "—"}</p>
      </div>
    </div>
  );
  if (href && value) {
    return (
      <a href={href} className="block hover:bg-muted/50 rounded-lg transition-colors">
        {content}
      </a>
    );
  }
  return content;
}

interface Props {
  account: Account;
  accountId: string;
}

export function ContactInfoSection({ account, accountId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [contactName, setContactName] = useState(account.contactName || "");
  const [contactEmail, setContactEmail] = useState(account.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(account.contactPhone || "");
  const [contactCity, setContactCity] = useState(account.contactCity || "");
  const [contactState, setContactState] = useState(account.contactState || "");
  const [phoneError, setPhoneError] = useState("");
  const updateAccount = useUpdateAccount();

  const handleSave = async () => {
    const phoneRegex = /^\+91 \d{10}$/;
    if (!phoneRegex.test(contactPhone)) {
      setPhoneError("Use format: +91 1234567890");
      return;
    }
    setPhoneError("");
    try {
      await updateAccount.mutateAsync({
        id: accountId,
        data: { contactName, contactEmail, contactPhone, contactCity, contactState },
      });
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save contact:", e);
    }
  };

  const handleCancel = () => {
    setContactName(account.contactName || "");
    setContactEmail(account.contactEmail || "");
    setContactPhone(account.contactPhone || "");
    setContactCity(account.contactCity || "");
    setContactState(account.contactState || "");
    setPhoneError("");
    setIsEditing(false);
  };

  if (!account.contactName && !account.contactEmail && !account.contactPhone) {
    return (
      <div className={`${accountCard} p-10 text-center`}>
        <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">No contact on file</p>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Add contact
        </button>
      </div>
    );
  }

  return (
    <div className={accountCard}>
      <div className="px-5 py-4 border-b border-black/8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className={accountSectionTitle}>Customer information</h3>
            <p className="text-base font-bold text-foreground truncate">
              {contactName || "Unassigned"}
            </p>
          </div>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-black/15 hover:bg-muted/50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-black/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateAccount.isPending}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              {updateAccount.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        {isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Name", value: contactName, set: setContactName },
              { label: "Email", value: contactEmail, set: setContactEmail, type: "email" },
              { label: "Phone", value: contactPhone, set: setContactPhone, type: "tel" },
              { label: "City", value: contactCity, set: setContactCity },
              { label: "State", value: contactState, set: setContactState },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input
                  type={f.type || "text"}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-black/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            {phoneError && <p className="text-xs text-destructive sm:col-span-2">{phoneError}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoCell
              label="Email"
              value={contactEmail}
              icon={<Mail className="w-4 h-4" />}
              href={contactEmail ? `mailto:${contactEmail}` : undefined}
            />
            <InfoCell
              label="Phone"
              value={contactPhone}
              icon={<Phone className="w-4 h-4" />}
              href={contactPhone ? `tel:${contactPhone}` : undefined}
            />
            <InfoCell label="City" value={contactCity} icon={<Building2 className="w-4 h-4" />} />
            <InfoCell
              label="Contract start"
              value={account.contractStart || "—"}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoCell
              label="Contract end"
              value={account.contractEnd || "—"}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoCell
              label="Renewal date"
              value={account.renewalDate || "—"}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoCell label="Customer success manager" value={account.csm || "—"} />
            <InfoCell
              label="Partner"
              value={account.partnerName ?? account.csm ?? "—"}
            />
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
              <span>💡</span>
              Last interaction recorded <span className="font-semibold text-foreground">3 days ago</span> via voice outreach.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
